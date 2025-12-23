import Gizmos from "@rbxts/gizmos";
import { TweenService, Workspace } from "@rbxts/services";
import { AirControl, Crouching, Detection, Jumping, Sliding, Speeds, WallRunning } from "shared/constants/movement";
import {
	MovementStateContext,
	MovementStateType,
	CollisionPart,
	WallDirection,
	isACollisionPart,
} from "shared/types/movement";
import MovementStateMachine from "./MovementStateMachine";

class MovementCharacter implements MovementStateContext {
	lastJumpTick = 0;

	cameraTiltZ = new Instance("NumberValue");

	private stateMachine: MovementStateMachine;

	private raycastParams = new RaycastParams();

	private toSprint = false;
	private toCrouch = false;

	private collisionPartC1Tween?: Tween;
	private collisionPartSizeTween?: Tween;

	static create(character: Model, rootPart: BasePart, humanoid: Humanoid): MovementCharacter | undefined {
		const collisionPart = character.WaitForChild("CollisionPart");
		if (!collisionPart || !isACollisionPart(collisionPart)) {
			warn("CollisionPart not found on character");
			return undefined;
		}

		const controllerManager = character.FindFirstChildOfClass("ControllerManager");
		if (!controllerManager) {
			warn("ControllerManager not found on character");
			return undefined;
		}

		const airController = controllerManager.FindFirstChildOfClass("AirController");
		if (!airController) {
			warn("AirController not found on ControllerManager");
			return undefined;
		}

		const groundController = controllerManager.FindFirstChildOfClass("GroundController");
		if (!groundController) {
			warn("GroundController not found on ControllerManager");
			return undefined;
		}

		const groundSensor = character.PrimaryPart?.FindFirstChild("GroundSensor");
		if (!groundSensor || !groundSensor.IsA("ControllerPartSensor")) {
			warn("ControllerPartSensor 'GroundSensor' not found on character's PrimaryPart");
			return undefined;
		}

		const wallSensor = character.PrimaryPart?.FindFirstChild("WallSensor");
		if (!wallSensor || !wallSensor.IsA("ControllerPartSensor")) {
			warn("ControllerPartSesnor 'WallSensor' not found on character's PrimaryPart");
			return undefined;
		}

		return new MovementCharacter(
			character,
			rootPart,
			collisionPart,
			humanoid,
			controllerManager,
			airController,
			groundController,
			groundSensor,
			wallSensor,
		);
	}

	constructor(
		readonly character: Model,
		readonly rootPart: BasePart,
		readonly collisionPart: CollisionPart,
		readonly humanoid: Humanoid,
		readonly controllerManager: ControllerManager,
		readonly airController: AirController,
		readonly groundController: GroundController,
		readonly groundSensor: ControllerPartSensor,
		readonly wallSensor: ControllerPartSensor,
		readonly mass = rootPart.GetMass(),
	) {
		this.stateMachine = new MovementStateMachine(this);

		this.raycastParams.FilterDescendantsInstances = [this.character];
		this.raycastParams.FilterType = Enum.RaycastFilterType.Exclude;
	}

	update(dt: number, facingDirection: Vector3): void {
		this.controllerManager.FacingDirection = facingDirection;
		this.stateMachine.update(dt);

		//this.collisionPart.Transparency = Gizmos.enabled ? 0.5 : 1;
		Gizmos.log(tostring(math.round(this.rootPart.AssemblyLinearVelocity.Magnitude * 100) / 100) + " studs/s");
	}

	handleJumpRequest(): void {
		this.stateMachine.changeState(MovementStateType.Jumping);
	}

	handleSprintRequest(toSprint: boolean): void {
		this.toSprint = toSprint;
	}

	handleCrouchRequest(toCrouch: boolean): void {
		this.toCrouch = toCrouch;
		if (toCrouch) this.stateMachine.changeState(MovementStateType.Crouched);
	}

	applyAirControlImpulse(moveDirection: Vector3) {
		if (moveDirection === Vector3.zero) return;

		let impulseDirection = moveDirection;
		const velocity = this.getHorizontalVelocity();
		if (velocity.Magnitude > 0) {
			const dot = moveDirection.Dot(velocity.Unit);
			if (dot > 0 && velocity.Magnitude >= AirControl.MAX_SPEED)
				impulseDirection = moveDirection.sub(velocity.Unit.mul(dot));
		}

		if (impulseDirection.Magnitude > 0)
			this.rootPart.ApplyImpulse(impulseDirection.mul(AirControl.IMPULSE * this.mass));
	}

	performGroundCheck() {
		const cframe = this.collisionPart.GetPivot();
		const size = this.collisionPart.Size;
		const direction = Vector3.yAxis.mul(
			-(this.humanoid.HipHeight - this.collisionPart.Weld.C0.Y + Detection.GROUND_SEARCH_DISTANCE),
		);
		const raycastResult = Workspace.Blockcast(cframe, size, direction, this.raycastParams);
		if (raycastResult) {
			this.groundSensor.HitFrame = new CFrame(raycastResult.Position);
			this.groundSensor.HitNormal = raycastResult.Normal;
			this.groundSensor.SensedPart = raycastResult.Instance;
		}

		//Gizmos.drawBlockcast(cframe, size, direction, raycastResult);

		return raycastResult;
	}

	performCeilingCheck(distance = Detection.CEILING_SEARCH_DISTANCE) {
		const cframe = this.collisionPart.GetPivot();
		const size = this.collisionPart.Size;
		const direction = Vector3.yAxis.mul(distance);
		const raycastResult = Workspace.Blockcast(cframe, size, direction, this.raycastParams);

		//Gizmos.drawBlockcast(cframe, size, direction, raycastResult);

		return raycastResult;
	}

	performWallCheck(direction: WallDirection) {
		const rootCFrame = this.character.GetPivot();

		const origin = rootCFrame.Position;
		const rayDir = rootCFrame.RightVector.mul(direction === WallDirection.Left ? -1 : 1).mul(
			WallRunning.GROUND_OFFSET + Detection.WALL_SEARCH_DISTANCE,
		);
		const raycastResult = Workspace.Raycast(origin, rayDir, this.raycastParams);

		if (raycastResult && raycastResult.Normal.Dot(Vector3.yAxis) === 0) {
			this.wallSensor.HitFrame = new CFrame(raycastResult.Position);
			this.wallSensor.HitNormal = raycastResult.Normal;
			this.wallSensor.SensedPart = raycastResult.Instance;

			return raycastResult;
		}

		//Gizmos.drawRaycast(origin, rayDir, raycastResult);

		return undefined;
	}

	configCollisionPartForState(stateType?: MovementStateType, isCrouchFallLand = false) {
		if (this.collisionPartC1Tween) {
			this.collisionPartC1Tween.Cancel();
			this.collisionPartC1Tween = undefined;
		}
		if (this.collisionPartSizeTween) {
			this.collisionPartSizeTween.Cancel();
			this.collisionPartSizeTween = undefined;
		}

		switch (stateType) {
			case MovementStateType.Crouched: {
				this.collisionPart.Size = Detection.COLLISION_PART_SIZE.sub(new Vector3(0, Crouching.OFFSET, 0));

				const c1 = new CFrame(0, -(Crouching.OFFSET / 2), 0);
				if (isCrouchFallLand) {
					this.tweenCollisionPartC1(c1);
				} else {
					this.collisionPart.Weld.C1 = c1;
				}

				this.tweenCameraOffset(new Vector3(0, -Crouching.OFFSET, 0));

				break;
			}
			case MovementStateType.CrouchFall: {
				this.collisionPart.Size = Detection.COLLISION_PART_SIZE.sub(new Vector3(0, Crouching.OFFSET, 0));
				this.collisionPart.Weld.C1 = new CFrame(0, Crouching.OFFSET / 2, 0);

				this.tweenCameraOffset(new Vector3(0, Crouching.OFFSET, 0));

				break;
			}
			case MovementStateType.Sliding: {
				this.collisionPart.Size = Detection.COLLISION_PART_SIZE.sub(new Vector3(0, Sliding.OFFSET, 0));

				const c1 = new CFrame(0, -(Sliding.OFFSET / 2), 0);
				if (isCrouchFallLand) {
					this.tweenCollisionPartC1(c1);
				} else {
					this.collisionPart.Weld.C1 = c1;
				}

				this.tweenCameraOffset(new Vector3(0, -Sliding.OFFSET, 0));

				break;
			}
			default: {
				// Always tween when increasing collision part size to prevent clipping
				this.collisionPartSizeTween = TweenService.Create(
					this.collisionPart,
					new TweenInfo(Detection.COLLISION_PART_TWEEN_TIME),
					{
						Size: Detection.COLLISION_PART_SIZE,
					},
				);
				this.collisionPartSizeTween.Play();

				const c1 = new CFrame();
				if (isCrouchFallLand) {
					this.tweenCollisionPartC1(c1);
				} else {
					this.collisionPart.Weld.C1 = c1;
				}

				this.tweenCameraOffset(Vector3.zero);

				break;
			}
		}
	}

	tiltCameraForWallRun(direction?: WallDirection) {
		let tiltAngle = 0;
		if (direction === WallDirection.Left) {
			tiltAngle = -WallRunning.CAMERA_TILT_ANGLE;
		} else if (direction === WallDirection.Right) {
			tiltAngle = WallRunning.CAMERA_TILT_ANGLE;
		}
		TweenService.Create(this.cameraTiltZ, new TweenInfo(Detection.CAMERA_OFFSET_TWEEN_TIME), {
			Value: tiltAngle,
		}).Play();
	}

	isAtSpeed(speed: number) {
		return this.getHorizontalVelocity().Magnitude >= speed - Speeds.TRANSITION_BUFFER;
	}

	isBelowSpeed(speed: number) {
		return this.getHorizontalVelocity().Magnitude < speed - Speeds.TRANSITION_BUFFER;
	}

	hasCompletedJump() {
		return os.clock() - this.lastJumpTick >= Jumping.MIN_TIME;
	}

	isOnSteepSlope() {
		return this.groundSensor.HitNormal.Angle(Vector3.yAxis) > math.rad(Sliding.MAX_SLOPE_ANGLE);
	}

	getWallSide(normal: Vector3) {
		return normal.Dot(this.character.GetPivot().RightVector) > 0 ? WallDirection.Left : WallDirection.Right;
	}

	getHorizontalVelocity(): Vector3 {
		const velocity = this.rootPart.AssemblyLinearVelocity;
		return new Vector3(velocity.X, 0, velocity.Z);
	}

	getMovementStateType() {
		return this.stateMachine.getMovementStateType();
	}

	getToSprint() {
		return this.toSprint;
	}

	getToCrouch() {
		return this.toCrouch;
	}

	destroy(): void {
		this.stateMachine.destroy();
	}

	private tweenCollisionPartC1(c1: CFrame): void {
		this.collisionPartC1Tween = TweenService.Create(
			this.collisionPart.Weld,
			new TweenInfo(Detection.COLLISION_PART_TWEEN_TIME),
			{
				C1: c1,
			},
		);
		this.collisionPartC1Tween.Play();
	}

	private tweenCameraOffset(offset: Vector3): void {
		TweenService.Create(this.humanoid, new TweenInfo(Detection.CAMERA_OFFSET_TWEEN_TIME), {
			CameraOffset: offset,
		}).Play();
	}
}

export default MovementCharacter;
