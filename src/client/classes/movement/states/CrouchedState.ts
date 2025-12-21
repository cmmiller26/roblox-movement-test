import { Crouching, Sliding, Speeds } from "shared/constants/movement";
import { MovementStateType } from "shared/types/movement";
import MovementState from "./MovementState";

class CrouchedState extends MovementState {
	readonly stateType = MovementStateType.Crouched;

	enter(prevStateType: MovementStateType) {
		if (!this.context.groundSensor.SensedPart) return MovementStateType.CrouchFall;

		if (this.context.getToCrouch() && this.context.isAtSpeed(Speeds.RUNNING)) {
			this.applySlidingImpulse(this.context.rootPart);
			return MovementStateType.Sliding;
		}
		if (this.context.isOnSteepSlope()) return MovementStateType.Sliding;

		this.context.humanoid.ChangeState(Enum.HumanoidStateType.Running);
		this.context.controllerManager.BaseMoveSpeed = Speeds.CROUCHED;

		if (prevStateType !== MovementStateType.Landed) this.context.configCollisionPartForState(this.stateType);

		return undefined;
	}

	update() {
		this.context.controllerManager.MovingDirection = this.context.humanoid.MoveDirection;

		if (this.context.performGroundCheck()) {
			if (!this.context.getToCrouch()) return MovementStateType.Walking;
			if (this.context.isOnSteepSlope()) return MovementStateType.Sliding;
			return undefined;
		}
		return MovementStateType.CrouchFall;
	}

	override exit() {
		if (this.context.performCeilingCheck(Crouching.OFFSET)) return false;

		this.context.configCollisionPartForState();

		return true;
	}

	private applySlidingImpulse(rootPart: BasePart) {
		const normal = this.context.groundSensor.HitNormal;
		const forward = this.context.character.GetPivot().LookVector;
		const slideDir = forward.sub(normal.mul(forward.Dot(normal)));
		rootPart.ApplyImpulse(slideDir.mul(Sliding.IMPULSE * this.context.mass));
	}
}

export default CrouchedState;
