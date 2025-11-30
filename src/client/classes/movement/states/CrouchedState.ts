import {
	CROUCH_OFFSET,
	CROUCHED_SPEED,
	RUNNING_SPEED,
	SPEED_TRANSITION_BUFFER,
	SLIDING_IMPULSE,
	MAX_SLOPE_ANGLE,
} from "shared/constants/Movement";
import { MovementStateType } from "shared/types/Movement";
import MovementState from "./MovementState";

class CrouchedState extends MovementState {
	readonly stateType = MovementStateType.Crouched;

	enter(prevStateType: MovementStateType) {
		if (!this.context.groundSensor.SensedPart) return MovementStateType.CrouchFall;

		if (this.context.rootPart.AssemblyLinearVelocity.Magnitude >= RUNNING_SPEED - SPEED_TRANSITION_BUFFER) {
			this.applySlidingImpulse(this.context.rootPart);
			return MovementStateType.Sliding;
		}
		if (this.isOnSteepSlope()) return MovementStateType.Sliding;

		this.context.humanoid.ChangeState(Enum.HumanoidStateType.Running);
		this.context.controllerManager.BaseMoveSpeed = CROUCHED_SPEED;

		if (prevStateType !== MovementStateType.Landed) this.context.configCollisionPartForState(this.stateType);

		return undefined;
	}

	update() {
		this.context.controllerManager.MovingDirection = this.context.humanoid.MoveDirection;

		if (this.context.performGroundCheck()) {
			if (!this.context.getToCrouch()) return MovementStateType.Walking;
			if (this.isOnSteepSlope()) return MovementStateType.Sliding;
			return undefined;
		}
		return MovementStateType.CrouchFall;
	}

	override exit() {
		if (this.context.performCeilingCheck(CROUCH_OFFSET)) return false;

		this.context.configCollisionPartForState();

		return true;
	}

	private applySlidingImpulse(rootPart: BasePart) {
		const normal = this.context.groundSensor.HitNormal;
		const forward = this.context.character.GetPivot().LookVector;
		const slideDir = forward.sub(normal.mul(forward.Dot(normal)));
		rootPart.ApplyImpulse(slideDir.mul(SLIDING_IMPULSE * this.context.mass));
	}

	private isOnSteepSlope() {
		return this.context.groundSensor.HitNormal.Angle(Vector3.yAxis) > math.rad(MAX_SLOPE_ANGLE);
	}
}

export default CrouchedState;
