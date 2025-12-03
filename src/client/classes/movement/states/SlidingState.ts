import {
	SLIDING_OFFSET,
	CROUCHED_SPEED,
	DEFAULT_FRICTION,
	SLIDING_FRICTION,
	MIN_SLIDE_TIME,
} from "shared/constants/Movement";
import { MovementStateType } from "shared/types/Movement";
import MovementState from "./MovementState";

class SlidingState extends MovementState {
	readonly stateType = MovementStateType.Sliding;

	private lastSlideTick = os.clock();

	enter(prevStateType: MovementStateType) {
		this.context.humanoid.ChangeState(Enum.HumanoidStateType.Running);

		this.context.controllerManager.MovingDirection = Vector3.zero;
		this.context.groundController.Friction = SLIDING_FRICTION;

		if (prevStateType !== MovementStateType.Landed) this.context.configCollisionPartForState(this.stateType);

		this.lastSlideTick = os.clock();

		return undefined;
	}

	override update(dt: number) {
		if (this.context.performGroundCheck()) {
			if (!this.context.isOnSteepSlope() && this.context.isBelowSpeed(CROUCHED_SPEED))
				return MovementStateType.Crouched;
			return undefined;
		}
		return MovementStateType.Freefall;
	}

	override exit(nextStateType?: MovementStateType) {
		if (os.clock() - this.lastSlideTick < MIN_SLIDE_TIME) return false;
		if (nextStateType !== MovementStateType.Crouched && this.context.performCeilingCheck(SLIDING_OFFSET))
			return false;

		this.context.groundController.Friction = DEFAULT_FRICTION;

		this.context.configCollisionPartForState();

		return true;
	}
}

export default SlidingState;
