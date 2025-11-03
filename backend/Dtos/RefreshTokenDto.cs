namespace backend.Dtos;

public record RefreshTokenDto(string AccessToken, int ExpiresIn, string TokenType);