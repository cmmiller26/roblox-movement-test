import { CROUCH_OFFSET, MIN_JUMP_TIME, CROUCH_FALL_DELAY } from "shared/constants/Movement";
import { MovementStateType } from "shared/types/Movement";
import MovementState from "./MovementState";

class CrouchFallState extends MovementState {
	readonly stateType = MovementStateType.CrouchFall;

	enter() {
		this.context.humanoid.ChangeState(Enum.HumanoidStateType.Freefall);
		this.context.controllerManager.ActiveController = this.context.airController;

		this.context.groundSensor.SensedPart = undefined;
		this.context.groundController.GroundOffset = this.context.humanoid.HipHeight - CROUCH_OFFSET;

		this.context.configCollisionPartForState(this.stateType);

		return undefined;
	}

	update() {
		this.context.controllerManager.MovingDirection = this.context.humanoid.MoveDirection;

		if (this.hasCompletedJump() && this.context.performGroundCheck()) {
			return MovementStateType.Landed;
		}
		if (!this.context.getToCrouch()) return MovementStateType.Freefall;
		return undefined;
	}

	override exit(nextStateType?: MovementStateType) {
		if (!this.hasCompletedJump() || !this.context.groundSensor.SensedPart) return false;

		if (nextStateType === MovementStateType.Landed) {
			// Delay resetting crouch properties to make crouch jumping easier
			task.delay(CROUCH_FALL_DELAY, () => this.resetCrouchProperties(true));
		} else {
			this.resetCrouchProperties();
		}

		return true;
	}

	private resetCrouchProperties(delayed = false) {
		this.context.groundController.GroundOffset = this.context.humanoid.HipHeight;
		if (delayed) {
			this.context.configCollisionPartForState(this.context.getMovementStateType(), true);
		} else {
			this.context.configCollisionPartForState();
		}
	}

	private hasCompletedJump(): boolean {
		return os.clock() - this.context.lastJumpTick >= MIN_JUMP_TIME;
	}
}

export default CrouchFallState;
