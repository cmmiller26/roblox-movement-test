import { Speeds } from "shared/constants/Movement";
import { MovementStateType } from "shared/types/Movement";
import MovementState from "./MovementState";

class RunningState extends MovementState {
	readonly stateType = MovementStateType.Running;

	enter() {
		this.context.humanoid.ChangeState(Enum.HumanoidStateType.Running);

		this.context.controllerManager.BaseMoveSpeed = Speeds.RUNNING;

		return undefined;
	}

	update(dt: number) {
		this.context.controllerManager.MovingDirection = this.context.humanoid.MoveDirection;

		if (this.context.performGroundCheck()) {
			if (!this.context.getToSprint()) return MovementStateType.Walking;
			return undefined;
		}
		return MovementStateType.Freefall;
	}
}

export default RunningState;
