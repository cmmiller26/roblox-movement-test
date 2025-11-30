import { Workspace } from "@rbxts/services";
import { WALL_RUN_GROUND_OFFSET, WALL_RUNNING_SPEED, SPEED_TRANSITION_BUFFER } from "shared/constants/Movement";
import { MovementStateType, WallDirection } from "shared/types/Movement";
import MovementState from "./MovementState";

class WallRunning extends MovementState {
	readonly stateType = MovementStateType.WallRunning;

	private wallSide: WallDirection = WallDirection.Left;

	enter() {
		const normal = this.context.wallSensor.HitNormal;
		const velocity = this.context.rootPart.AssemblyLinearVelocity;
		if (new Vector3(velocity.X, 0, velocity.Z).Magnitude < WALL_RUNNING_SPEED - SPEED_TRANSITION_BUFFER) {
			return MovementStateType.Freefall;
		}

		this.context.humanoid.ChangeState(Enum.HumanoidStateType.Running);
		this.context.controllerManager.ActiveController = this.context.groundController;

		this.context.controllerManager.BaseMoveSpeed = WALL_RUNNING_SPEED;
		this.context.controllerManager.GroundSensor = this.context.wallSensor;

		this.context.groundController.GroundOffset = WALL_RUN_GROUND_OFFSET;

		this.wallSide =
			this.context.wallSensor.HitNormal.Dot(this.context.character.GetPivot().RightVector) > 0
				? WallDirection.Left
				: WallDirection.Right;

		const parallelVelocity = velocity.sub(normal.mul(velocity.Dot(normal)));
		this.context.rootPart.AssemblyLinearVelocity = new Vector3(parallelVelocity.X, 0, parallelVelocity.Z).Unit.mul(
			velocity.Magnitude,
		);

		this.context.tiltCameraForWallRun(this.wallSide);

		return undefined;
	}

	update(dt: number) {
		if (this.context.performGroundCheck()) return MovementStateType.Landed;
		if (this.context.performWallCheck(this.wallSide)) {
			const normal = this.context.wallSensor.HitNormal;
			const forward = this.context.character.GetPivot().LookVector;
			this.context.controllerManager.MovingDirection = forward.sub(normal.mul(forward.Dot(normal)));

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
