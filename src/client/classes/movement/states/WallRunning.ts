import { Workspace } from "@rbxts/services";
import { WALL_RUN_GROUND_OFFSET, WALL_RUNNING_SPEED } from "shared/constants/Movement";
import { MovementStateType } from "shared/types/Movement";
import MovementState from "./MovementState";

class WallRunning extends MovementState {
	readonly stateType = MovementStateType.WallRunning;

	private wallSide: "L" | "R" = "L";

	enter() {
		this.context.humanoid.ChangeState(Enum.HumanoidStateType.Running);
		this.context.controllerManager.ActiveController = this.context.groundController;

		this.context.controllerManager.BaseMoveSpeed = WALL_RUNNING_SPEED;
		this.context.controllerManager.GroundSensor = this.context.wallSensor;

		this.context.groundController.GroundOffset = WALL_RUN_GROUND_OFFSET;

		const right = this.context.character.GetPivot().RightVector;
		this.wallSide = this.context.wallSensor.HitNormal.Dot(right) > 0 ? "L" : "R";

		const normal = this.context.wallSensor.HitNormal;
		const velocity = this.context.rootPart.AssemblyLinearVelocity;
		this.context.rootPart.ApplyImpulse(normal.mul(-velocity.Dot(normal) * this.context.mass));
		this.context.rootPart.ApplyImpulse(Vector3.yAxis.mul(-velocity.Y * this.context.mass));

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

		return true;
	}
}

export default WallRunning;
