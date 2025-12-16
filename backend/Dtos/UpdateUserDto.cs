namespace backend.Dtos;

public record UpdateUserDto(
    string? Name,
    string? Surname,
    string? PhoneNumber,
    string? Role
);
