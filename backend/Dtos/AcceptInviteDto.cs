namespace backend.Dtos;

public record AcceptInviteDto(
    string Token,
    string Email,
    string Password,
    string? Name,
    string? Surname
);

