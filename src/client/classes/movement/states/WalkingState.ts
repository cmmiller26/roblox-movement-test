import { Speeds } from "shared/constants/Movement";
import { MovementStateType } from "shared/types/Movement";
import MovementState from "./MovementState";

class WalkingState extends MovementState {
	readonly stateType = MovementStateType.Walking;

	enter() {
		if (this.checkSprintCondition()) return MovementStateType.Running;

		this.context.humanoid.ChangeState(Enum.HumanoidStateType.Running);

		this.context.controllerManager.BaseMoveSpeed = Speeds.WALKING;

		return undefined;
	}

	override update() {
		this.context.controllerManager.MovingDirection = this.context.humanoid.MoveDirection;

		if (this.context.performGroundCheck()) {
			if (this.checkSprintCondition()) return MovementStateType.Running;
			return undefined;
		}
		return MovementStateType.Freefall;
	}

	private checkSprintCondition(): boolean {
		return this.context.getToSprint() && this.context.isAtSpeed(Speeds.WALKING);
	}
}

export default WalkingState;
