namespace backend.Dtos;

public record ValidateInviteDto(
    string Email,
    string Role,
    bool IsValid,
    string? Message
);

