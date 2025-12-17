import { Physics } from "shared/constants/Movement";
import { MovementStateType } from "shared/types/Movement";
import MovementState from "./MovementState";

class LandedState extends MovementState {
	readonly stateType = MovementStateType.Landed;

	private prevStateType?: MovementStateType;

	enter(prevStateType?: MovementStateType) {
		if (this.context.groundSensor.SensedPart?.HasTag("Trampoline")) {
			const velocity = this.context.rootPart.AssemblyLinearVelocity;
			this.context.rootPart.AssemblyLinearVelocity = new Vector3(velocity.X, -velocity.Y, velocity.Z);

			return MovementStateType.Jumping;
		}

		this.context.humanoid.ChangeState(Enum.HumanoidStateType.Landed);
		this.context.controllerManager.ActiveController = this.context.groundController;

		this.context.groundController.Friction = 0;

		this.prevStateType = prevStateType;

		return undefined;
	}

	update() {
		if (this.context.performGroundCheck()) {
			if (this.prevStateType === MovementStateType.CrouchFall) return MovementStateType.Crouched;
			return MovementStateType.Walking;
		}
		return MovementStateType.Freefall;
	}

	override exit() {
		this.context.groundController.Friction = Physics.DEFAULT_FRICTION;
		return true;
	}
}

export default LandedState;
