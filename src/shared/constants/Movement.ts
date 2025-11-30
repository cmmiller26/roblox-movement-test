import { StarterPlayer, Workspace } from "@rbxts/services";

export const GROUND_SEARCH_DISTANCE = 0.25;
export const WALL_SEARCH_DISTANCE = 0.5;
export const COLLISION_PART_SIZE = new Vector3(2, 3, 1);
export const CROUCH_OFFSET = 1.5;
export const SLIDING_OFFSET = CROUCH_OFFSET + 0.5;
export const WALL_RUN_GROUND_OFFSET = 1;

export const WALKING_SPEED = StarterPlayer.CharacterWalkSpeed;
export const RUNNING_SPEED = WALKING_SPEED * 2;
export const CROUCHED_SPEED = WALKING_SPEED / 2;
export const WALL_RUNNING_SPEED = RUNNING_SPEED * 0.75;
export const SPEED_TRANSITION_BUFFER = 1;

export const JUMP_IMPULSE = math.sqrt(2 * Workspace.Gravity * StarterPlayer.CharacterJumpHeight);
export const SLIDE_JUMP_IMPULSE = JUMP_IMPULSE * 1.5;
export const WALL_JUMP_IMPULSE = JUMP_IMPULSE * 2;
export const JUMP_UPWARD_BLEND = 0.5;
export const SLIDE_JUMP_UPWARD_BLEND = 0.5;
export const WALL_JUMP_UPWARD_BLEND = 0.25;
export const SLIDING_IMPULSE = 25;
export const DEFAULT_FRICTION = 2;
export const SLIDING_FRICTION = DEFAULT_FRICTION / 4;

export const MIN_JUMP_TIME = 0.1;
export const MIN_SLIDE_TIME = 0.1;
export const MAX_SLOPE_ANGLE = 60;
export const CROUCH_FALL_DELAY = 0.05;
export const COLLISION_PART_TWEEN_TIME = 0.2;
export const CAMERA_OFFSET_TWEEN_TIME = 0.1;
export const WALL_RUN_CAMERA_TILT_ANGLE = 15;
