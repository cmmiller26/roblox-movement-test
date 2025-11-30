import {
	SLIDING_OFFSET,
	CROUCHED_SPEED,
	SPEED_TRANSITION_BUFFER,
	DEFAULT_FRICTION,
	SLIDING_FRICTION,
	MIN_SLIDE_TIME,
	MAX_SLOPE_ANGLE,
} from "shared/constants/Movement";
import { MovementStateType } from "shared/types/Movement";
import MovementState from "./MovementState";

class SlidingState extends MovementState {
	readonly stateType = MovementStateType.Sliding;

	private lastSlideTick = os.clock();

	enter(prevStateType: MovementStateType) {
		this.context.humanoid.ChangeState(Enum.HumanoidStateType.Running);

		this.context.controllerManager.MovingDirection = new Vector3();
		this.context.groundController.Friction = SLIDING_FRICTION;

		if (prevStateType !== MovementStateType.Landed) this.context.configCollisionPartForState(this.stateType);

		this.lastSlideTick = os.clock();

		return undefined;
	}

	override update(dt: number) {
		if (this.context.performGroundCheck()) {
			if (
				!this.isOnSteepSlope() &&
				this.context.rootPart.AssemblyLinearVelocity.Magnitude < CROUCHED_SPEED + SPEED_TRANSITION_BUFFER
			)
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

	private isOnSteepSlope() {
		return this.context.groundSensor.HitNormal.Angle(Vector3.yAxis) > math.rad(MAX_SLOPE_ANGLE);
	}
}

export default SlidingState;
