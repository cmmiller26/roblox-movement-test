import { Physics, Sliding, Speeds } from "shared/constants/Movement";
import { MovementStateType } from "shared/types/Movement";
import MovementState from "./MovementState";

class SlidingState extends MovementState {
	readonly stateType = MovementStateType.Sliding;

	private lastSlideTick = os.clock();

	enter(prevStateType: MovementStateType) {
		this.context.humanoid.ChangeState(Enum.HumanoidStateType.Running);

		this.context.controllerManager.MovingDirection = Vector3.zero;
		this.context.groundController.Friction = Sliding.FRICTION;

		if (prevStateType !== MovementStateType.Landed) this.context.configCollisionPartForState(this.stateType);

		this.lastSlideTick = os.clock();

		return undefined;
	}

	override update(dt: number) {
		if (this.context.performGroundCheck()) {
			if (!this.context.isOnSteepSlope() && this.context.isBelowSpeed(Speeds.CROUCHED))
				return MovementStateType.Crouched;
			return undefined;
		}
		return MovementStateType.Freefall;
	}

	override exit(nextStateType?: MovementStateType) {
		if (os.clock() - this.lastSlideTick < Sliding.MIN_TIME) return false;
		if (nextStateType !== MovementStateType.Crouched && this.context.performCeilingCheck(Sliding.OFFSET))
			return false;

		this.context.groundController.Friction = Physics.DEFAULT_FRICTION;
		this.context.configCollisionPartForState();

		return true;
	}
}

export default SlidingState;
