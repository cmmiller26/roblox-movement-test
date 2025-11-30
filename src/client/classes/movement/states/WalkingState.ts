import { WALKING_SPEED, SPEED_TRANSITION_BUFFER } from "shared/constants/Movement";
import { MovementStateType } from "shared/types/Movement";
import MovementState from "./MovementState";

class WalkingState extends MovementState {
	readonly stateType = MovementStateType.Walking;

	enter() {
		if (this.checkSprintCondition()) return MovementStateType.Running;

		this.context.humanoid.ChangeState(Enum.HumanoidStateType.Running);

		this.context.controllerManager.BaseMoveSpeed = WALKING_SPEED;

		return undefined;
	}

	override update(dt: number) {
		this.context.controllerManager.MovingDirection = this.context.humanoid.MoveDirection;

		if (this.context.performGroundCheck()) {
			if (this.checkSprintCondition()) return MovementStateType.Running;
			return undefined;
		}
		return MovementStateType.Freefall;
	}

	private checkSprintCondition(): boolean {
		const isAtWalkSpeed =
			this.context.rootPart.AssemblyLinearVelocity.Magnitude >= WALKING_SPEED - SPEED_TRANSITION_BUFFER;
		return this.context.getToSprint() && isAtWalkSpeed;
	}
}

export default WalkingState;
