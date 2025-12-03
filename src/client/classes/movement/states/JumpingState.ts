import {
	JUMP_IMPULSE,
	SLIDE_JUMP_IMPULSE,
	WALL_JUMP_IMPULSE,
	JUMP_UPWARD_BLEND,
	SLIDE_JUMP_UPWARD_BLEND,
	WALL_JUMP_UPWARD_BLEND,
} from "shared/constants/Movement";
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

		let jumpImpulse: number;
		let jumpUpwardBlend: number;
		switch (prevStateType) {
			case MovementStateType.Sliding:
				jumpImpulse = SLIDE_JUMP_IMPULSE;
				jumpUpwardBlend = SLIDE_JUMP_UPWARD_BLEND;
				break;
			case MovementStateType.WallRunning:
				jumpImpulse = WALL_JUMP_IMPULSE;
				jumpUpwardBlend = WALL_JUMP_UPWARD_BLEND;
				break;
			default:
				jumpImpulse = JUMP_IMPULSE;
				jumpUpwardBlend = JUMP_UPWARD_BLEND;
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
