namespace backend.Dtos;

public record InviteDto(
    int Id,
    string Email,
    string Role,
    int MerchantId,
    string InvitedByUserId,
    string Token,
    DateTime ExpiresAt,
    DateTime CreatedAt,
    DateTime? AcceptedAt,
    bool IsAccepted
);

