import { MovementStateType } from "shared/types/Movement";
import MovementState from "./MovementState";
import { SPEED_TRANSITION_BUFFER, MIN_JUMP_TIME, WALL_RUNNING_SPEED } from "shared/constants/Movement";

class FreefallState extends MovementState {
	readonly stateType = MovementStateType.Freefall;

	enter() {
		this.context.humanoid.ChangeState(Enum.HumanoidStateType.Freefall);
		this.context.controllerManager.ActiveController = this.context.airController;

		this.context.groundSensor.SensedPart = undefined;

		return undefined;
	}

	update() {
		const moveDirection = this.context.humanoid.MoveDirection;
		this.context.controllerManager.MovingDirection = moveDirection;

		if (this.hasCompletedJump() && this.context.performGroundCheck()) return MovementStateType.Landed;

		const inputVector = this.context.character.GetPivot().VectorToObjectSpace(moveDirection);
		if (
			inputVector.Z < -0.5 &&
			math.abs(inputVector.X) > 0.5 &&
			this.context.rootPart.AssemblyLinearVelocity.Magnitude >= WALL_RUNNING_SPEED - SPEED_TRANSITION_BUFFER &&
			this.context.performWallCheck(inputVector.X < 0 ? "L" : "R")
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
