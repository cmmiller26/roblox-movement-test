import { MIN_JUMP_TIME } from "shared/constants/Movement";
import { MovementStateType, WallDirection } from "shared/types/Movement";
import MovementState from "./MovementState";

class FreefallState extends MovementState {
	readonly stateType = MovementStateType.Freefall;

	enter() {
		this.context.humanoid.ChangeState(Enum.HumanoidStateType.Freefall);
		this.context.controllerManager.ActiveController = this.context.airController;
		this.context.controllerManager.MovingDirection = Vector3.zero;

		this.context.groundSensor.SensedPart = undefined;

		return undefined;
	}

	update() {
		const moveDirection = this.context.humanoid.MoveDirection;
		this.context.applyAirControlImpulse(moveDirection);

		if (this.hasCompletedJump() && this.context.performGroundCheck()) return MovementStateType.Landed;

		const inputVector = this.context.character.GetPivot().VectorToObjectSpace(moveDirection);
		if (
			inputVector.Z < -0.5 &&
			math.abs(inputVector.X) > 0.5 &&
			this.context.performWallCheck(inputVector.X < 0 ? WallDirection.Left : WallDirection.Right)
		)
			return MovementStateType.WallRunning;
		return undefined;
	}

	override exit(nextStateType?: MovementStateType) {
		if (nextStateType === MovementStateType.Crouched) return true;
		if (nextStateType === MovementStateType.WallRunning) return true;
		if (!this.hasCompletedJump() || !this.context.groundSensor.SensedPart) return false;
		return true;
	}

	private hasCompletedJump(): boolean {
		return os.clock() - this.context.lastJumpTick >= MIN_JUMP_TIME;
	}
}

export default FreefallState;
