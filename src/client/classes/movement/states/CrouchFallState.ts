import { RunService } from "@rbxts/services";
import { Crouching } from "shared/constants/Movement";
import { MovementStateType } from "shared/types/Movement";
import MovementState from "./MovementState";

class CrouchFallState extends MovementState {
	readonly stateType = MovementStateType.CrouchFall;

	enter() {
		this.context.humanoid.ChangeState(Enum.HumanoidStateType.Freefall);
		this.context.controllerManager.ActiveController = this.context.airController;
		this.context.controllerManager.MovingDirection = Vector3.zero;

		this.context.groundSensor.SensedPart = undefined;
		this.context.groundController.GroundOffset = this.context.humanoid.HipHeight - Crouching.OFFSET;

		this.context.configCollisionPartForState(this.stateType);

		return undefined;
	}

	update() {
		this.context.applyAirControlImpulse(this.context.humanoid.MoveDirection);

		if (this.context.hasCompletedJump() && this.context.performGroundCheck()) {
			return MovementStateType.Landed;
		}
		if (!this.context.getToCrouch()) return MovementStateType.Freefall;
		return undefined;
	}

	override exit(nextStateType?: MovementStateType) {
		if (!this.context.hasCompletedJump() || !this.context.groundSensor.SensedPart) return false;

		if (nextStateType === MovementStateType.Landed) {
			this.beginSettleMonitoring();
		} else {
			this.resetCrouchProperties();
		}

		return true;
	}

	private resetCrouchProperties(delayed = false) {
		this.context.groundController.GroundOffset = this.context.humanoid.HipHeight;
		this.context.configCollisionPartForState(delayed ? this.context.getMovementStateType() : undefined, delayed);
	}

	private beginSettleMonitoring() {
		const startTime = os.clock();
		const connection = RunService.PostSimulation.Connect(() => {
			const velocityY = this.context.rootPart.AssemblyLinearVelocity.Y;
			const elapsed = os.clock() - startTime;

			// Only reset if minimum time has passed AND (velocity is settled OR max time reached)
			// MIN_SETTLE_TIME ensures the GroundController has time to move the collision part upward after landing, even if velocity is already zero
			const minTimeReached = elapsed >= Crouching.FALL_MIN_SETTLE_TIME;
			const velocitySettled = math.abs(velocityY) <= Crouching.FALL_SETTLE_THRESHOLD;
			const maxTimeReached = elapsed >= Crouching.FALL_MAX_SETTLE_TIME;
			if (minTimeReached && (velocitySettled || maxTimeReached)) {
				this.resetCrouchProperties(true);
				connection.Disconnect();
			}
		});
	}
}

export default CrouchFallState;
