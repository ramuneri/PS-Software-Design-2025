namespace backend.Dtos;

public record LoginResponseDto(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,
    string TokenType,
    UserDto User
    );