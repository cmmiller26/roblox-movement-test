import { MovementStateContext, MovementStateType } from "shared/types/movement";

abstract class MovementState {
	abstract readonly stateType: MovementStateType;

	constructor(protected readonly context: MovementStateContext) {}

	abstract enter(prevStateType: MovementStateType): MovementStateType | undefined;

	abstract update(dt: number): MovementStateType | undefined;

	exit(nextStateType?: MovementStateType): boolean {
		return true;
	}
}

export default MovementState;
