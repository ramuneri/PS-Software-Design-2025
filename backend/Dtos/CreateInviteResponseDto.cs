namespace backend.Dtos;

public record CreateInviteResponseDto(
    int Id,
    string Email,
    string Role,
    string InviteLink,
    DateTime ExpiresAt
);

