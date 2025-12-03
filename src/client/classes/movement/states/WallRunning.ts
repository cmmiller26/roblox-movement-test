import { Workspace } from "@rbxts/services";
import { WALL_RUN_GROUND_OFFSET, WALL_RUNNING_SPEED, WALL_RUN_DEACCELERATION } from "shared/constants/Movement";
import { MovementStateType, WallDirection } from "shared/types/Movement";
import MovementState from "./MovementState";

class WallRunning extends MovementState {
	readonly stateType = MovementStateType.WallRunning;

	private wallSide: WallDirection = WallDirection.Left;

	enter() {
		if (this.context.isBelowSpeed(WALL_RUNNING_SPEED)) return MovementStateType.Freefall;

		this.context.humanoid.ChangeState(Enum.HumanoidStateType.Running);
		this.context.controllerManager.ActiveController = this.context.groundController;
		this.context.controllerManager.MovingDirection = Vector3.zero;

		this.context.controllerManager.BaseMoveSpeed = WALL_RUNNING_SPEED;
		this.context.controllerManager.GroundSensor = this.context.wallSensor;

		this.context.groundController.GroundOffset = WALL_RUN_GROUND_OFFSET;

		const normal = this.context.wallSensor.HitNormal;
		this.wallSide = this.context.getWallSide(normal);

		const velocity = this.context.getHorizontalVelocity();
		const parallelVelocity = velocity.sub(normal.mul(velocity.Dot(normal)));
		this.context.rootPart.AssemblyLinearVelocity = parallelVelocity.Unit.mul(velocity.Magnitude);

		this.context.tiltCameraForWallRun(this.wallSide);

		return undefined;
	}

	update(dt: number) {
		if (this.context.performGroundCheck()) return MovementStateType.Landed;

		const raycastResult = this.context.performWallCheck(this.wallSide);
		if (raycastResult) {
			const velocity = this.context.getHorizontalVelocity();
			if (velocity.Magnitude > WALL_RUNNING_SPEED) {
				const friction = raycastResult.Instance.CurrentPhysicalProperties.Friction;
				this.context.rootPart.ApplyImpulse(
					velocity.Unit.mul(-friction * WALL_RUN_DEACCELERATION * this.context.mass * dt),
				);
			}

			this.context.rootPart.ApplyImpulse(Vector3.yAxis.mul(Workspace.Gravity * this.context.mass * dt));

			return undefined;
		}
		return MovementStateType.Freefall;
	}

	override exit() {
		this.context.controllerManager.GroundSensor = this.context.groundSensor;

		this.context.groundController.GroundOffset = this.context.humanoid.HipHeight;

		this.context.tiltCameraForWallRun();

		return true;
	}
}

export default WallRunning;
