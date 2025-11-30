import { JUMP_IMPULSE, SLIDE_JUMP_IMPULSE, UPWARD_JUMP_BLEND } from "shared/constants/Movement";
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

		const jumpDir = normal.Lerp(Vector3.yAxis, UPWARD_JUMP_BLEND).Unit;
		const jumpForce =
			(prevStateType === MovementStateType.Sliding ? SLIDE_JUMP_IMPULSE : JUMP_IMPULSE) * this.context.mass;
		this.context.rootPart.ApplyImpulse(jumpDir.mul(jumpForce));

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
