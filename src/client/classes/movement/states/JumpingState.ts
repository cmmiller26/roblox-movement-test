import { Jumping } from "shared/constants/Movement";
import { MovementStateType } from "shared/types/Movement";
import MovementState from "./MovementState";

class JumpingState extends MovementState {
	readonly stateType = MovementStateType.Jumping;

	enter(prevStateType: MovementStateType) {
		this.context.humanoid.ChangeState(Enum.HumanoidStateType.Jumping);

		const groundSensor =
			prevStateType === MovementStateType.WallRunning ? this.context.wallSensor : this.context.groundSensor;
		const floor = groundSensor.SensedPart;
		const normal = floor ? groundSensor.HitNormal : Vector3.yAxis;

		let jumpImpulse = Jumping.IMPULSE;
		let jumpUpwardBlend = Jumping.UPWARD_BLEND;
		switch (prevStateType) {
			case MovementStateType.Sliding:
				jumpImpulse = Jumping.SLIDE_IMPULSE;
				jumpUpwardBlend = Jumping.SLIDE_UPWARD_BLEND;
				break;
			case MovementStateType.WallRunning:
				jumpImpulse = Jumping.WALL_IMPULSE;
				jumpUpwardBlend = Jumping.WALL_UPWARD_BLEND;
				break;
		}
		const jumpDir = normal.Lerp(Vector3.yAxis, jumpUpwardBlend).Unit;
		const jumpForce = jumpImpulse * this.context.mass;

		// Only apply jump impulse if there's no ceiling immediately above
		if (!this.context.performCeilingCheck()) this.context.rootPart.ApplyImpulse(jumpDir.mul(jumpForce));

		if (floor) floor.ApplyImpulseAtPosition(jumpDir.mul(-jumpForce), groundSensor.HitFrame.Position);
		groundSensor.SensedPart = undefined;

		this.context.lastJumpTick = os.clock();

		return undefined;
	}

	update() {
		return MovementStateType.Freefall;
	}
}

export default JumpingState;
