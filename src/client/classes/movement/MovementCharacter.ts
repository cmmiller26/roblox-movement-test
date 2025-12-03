import Gizmos from "@rbxts/gizmos";
import { TweenService, Workspace } from "@rbxts/services";
import {
	GROUND_SEARCH_DISTANCE,
	CEILING_SEARCH_DISTANCE,
	WALL_SEARCH_DISTANCE,
	COLLISION_PART_SIZE,
	CROUCH_OFFSET,
	SLIDING_OFFSET,
	SPEED_TRANSITION_BUFFER,
	AIR_CONTROL_IMPULSE,
	MAX_AIR_CONTROL_SPEED,
	MIN_JUMP_TIME,
	MAX_SLOPE_ANGLE,
	WALL_RUN_GROUND_OFFSET,
	COLLISION_PART_TWEEN_TIME,
	CAMERA_OFFSET_TWEEN_TIME,
	WALL_RUN_CAMERA_TILT_ANGLE,
} from "shared/constants/Movement";
import { MovementStateContext, MovementStateType, CollisionPart, WallDirection } from "shared/types/Movement";
import MovementStateMachine from "./MovementStateMachine";

class MovementCharacter implements MovementStateContext {
	lastJumpTick = 0;

	cameraTiltZ = new Instance("NumberValue");

	private stateMachine: MovementStateMachine;

	private raycastParams = new RaycastParams();

	private toSprint = false;
	private toCrouch = false;

	static fromModel(character: Model): MovementCharacter | undefined {
		const rootPart = character.WaitForChild("HumanoidRootPart") as BasePart;
		const collisionPart = character.WaitForChild("CollisionPart") as CollisionPart;
		const humanoid = character.WaitForChild("Humanoid") as Humanoid;

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

		print("MovementCharacter initialized");
	}

	update(dt: number, facingDirection: Vector3): void {
		this.controllerManager.FacingDirection = facingDirection;
		this.stateMachine.update(dt);

		Gizmos.log(tostring(math.round(this.getHorizontalVelocity().Magnitude * 100) / 100) + " studs/s");
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
			if (dot > 0 && velocity.Magnitude >= MAX_AIR_CONTROL_SPEED)
				impulseDirection = moveDirection.sub(velocity.Unit.mul(dot));
		}

		if (impulseDirection.Magnitude > 0)
			this.rootPart.ApplyImpulse(impulseDirection.mul(AIR_CONTROL_IMPULSE * this.mass));
	}

	performGroundCheck() {
		const cframe = this.collisionPart.GetPivot();
		const size = this.collisionPart.Size;
		const direction = Vector3.yAxis.mul(
			-(this.humanoid.HipHeight - this.collisionPart.Weld.C0.Y + GROUND_SEARCH_DISTANCE),
		);
		const raycastResult = Workspace.Blockcast(cframe, size, direction, this.raycastParams);
		if (raycastResult) {
			this.groundSensor.HitFrame = new CFrame(raycastResult.Position);
			this.groundSensor.HitNormal = raycastResult.Normal;
			this.groundSensor.SensedPart = raycastResult.Instance;
		}

		Gizmos.drawBlockcast(cframe, size, direction, raycastResult);

		return raycastResult;
	}

	performCeilingCheck(distance = CEILING_SEARCH_DISTANCE) {
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
			WALL_RUN_GROUND_OFFSET + WALL_SEARCH_DISTANCE,
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
		switch (stateType) {
			case MovementStateType.Crouched: {
				this.collisionPart.Size = COLLISION_PART_SIZE.sub(new Vector3(0, CROUCH_OFFSET, 0));

				const c1 = new CFrame(0, -(CROUCH_OFFSET / 2), 0);
				if (isCrouchFallLand) {
					this.tweenCollisionPartC1(c1);
				} else {
					this.collisionPart.Weld.C1 = c1;
				}

				this.tweenCameraOffset(new Vector3(0, -CROUCH_OFFSET, 0));

				break;
			}
			case MovementStateType.CrouchFall: {
				this.collisionPart.Size = COLLISION_PART_SIZE.sub(new Vector3(0, CROUCH_OFFSET, 0));
				this.collisionPart.Weld.C1 = new CFrame(0, CROUCH_OFFSET / 2, 0);

				this.tweenCameraOffset(new Vector3(0, CROUCH_OFFSET, 0));

				break;
			}
			case MovementStateType.Sliding: {
				this.collisionPart.Size = COLLISION_PART_SIZE.sub(new Vector3(0, SLIDING_OFFSET, 0));

				const c1 = new CFrame(0, -(SLIDING_OFFSET / 2), 0);
				if (isCrouchFallLand) {
					this.tweenCollisionPartC1(c1);
				} else {
					this.collisionPart.Weld.C1 = c1;
				}

				this.tweenCameraOffset(new Vector3(0, -SLIDING_OFFSET, 0));

				break;
			}
			default: {
				// Always tween when increasing collision part size to prevent clipping
				TweenService.Create(this.collisionPart, new TweenInfo(COLLISION_PART_TWEEN_TIME), {
					Size: COLLISION_PART_SIZE,
				}).Play();

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
			tiltAngle = -WALL_RUN_CAMERA_TILT_ANGLE;
		} else if (direction === WallDirection.Right) {
			tiltAngle = WALL_RUN_CAMERA_TILT_ANGLE;
		}
		TweenService.Create(this.cameraTiltZ, new TweenInfo(CAMERA_OFFSET_TWEEN_TIME), {
			Value: tiltAngle,
		}).Play();
	}

	isAtSpeed(speed: number) {
		return this.getHorizontalVelocity().Magnitude >= speed - SPEED_TRANSITION_BUFFER;
	}

	isBelowSpeed(speed: number) {
		return this.getHorizontalVelocity().Magnitude < speed - SPEED_TRANSITION_BUFFER;
	}

	hasCompletedJump() {
		return os.clock() - this.lastJumpTick >= MIN_JUMP_TIME;
	}

	isOnSteepSlope() {
		return this.groundSensor.HitNormal.Angle(Vector3.yAxis) > math.rad(MAX_SLOPE_ANGLE);
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
		TweenService.Create(this.collisionPart.Weld, new TweenInfo(COLLISION_PART_TWEEN_TIME), {
			C1: c1,
		}).Play();
	}

	private tweenCameraOffset(offset: Vector3): void {
		TweenService.Create(this.humanoid, new TweenInfo(CAMERA_OFFSET_TWEEN_TIME), {
			CameraOffset: offset,
		}).Play();
	}
}

export default MovementCharacter;
