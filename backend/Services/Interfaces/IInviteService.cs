using backend.Dtos;

namespace backend.Services.Interfaces;

public interface IInviteService
{
    Task<CreateInviteResponseDto?> CreateInviteAsync(CreateInviteDto dto, int merchantId, string invitedByUserId, string baseUrl);
    Task<ValidateInviteDto?> ValidateInviteTokenAsync(string token);
    Task<UserDto?> AcceptInviteAsync(AcceptInviteDto dto);
}

