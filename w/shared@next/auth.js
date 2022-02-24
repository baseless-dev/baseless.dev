export class User {
    id;
    email;
    emailConfirmed;
    refreshTokenId;
    metadata;
    constructor(id, email, emailConfirmed, refreshTokenId, metadata) {
        this.id = id;
        this.email = email;
        this.emailConfirmed = emailConfirmed;
        this.refreshTokenId = refreshTokenId;
        this.metadata = metadata;
    }
}
export class AnonymousUserError extends Error {
    name = "AnonymousUserError";
}
export class UserNotFoundError extends Error {
    name = "UserNotFoundError";
}
export class EmailNotFoundError extends Error {
    name = "EmailNotFoundError";
}
export class UserAlreadyExistsError extends Error {
    name = "UserAlreadyExistsError";
}
export class UserNeedsAnEmailError extends Error {
    name = "UserNeedsAnEmailError";
}
export class EmailNeedsConfirmationError extends Error {
    name = "EmailNeedsConfirmationError";
}
export class CreateUserError extends Error {
    name = "CreateUserError";
}
export class UpdateUserError extends Error {
    name = "UpdateUserError";
}
export class DeleteUserError extends Error {
    name = "DeleteUserError";
}
export class AddSignInEmailPasswordError extends Error {
    name = "AddSignInEmailPasswordError";
}
export class SignInEmailPasswordError extends Error {
    name = "SignInEmailPasswordError";
}
export class SetValidationCodeError extends Error {
    name = "SetValidationCodeError";
}
export class ValidationCodeError extends Error {
    name = "ValidationCodeError";
}
export class SetPasswordResetError extends Error {
    name = "SetPasswordResetError";
}
export class PasswordResetError extends Error {
    name = "PasswordResetError";
}
export class RefreshTokensError extends Error {
    name = "RefreshTokensError";
}
export class UpdatePasswordError extends Error {
    name = "UpdatePasswordError";
}
