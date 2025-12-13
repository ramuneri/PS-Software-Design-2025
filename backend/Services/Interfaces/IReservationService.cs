using backend.Dtos;

namespace backend.Services.Interfaces;

public interface IReservationService
{
    Task<IEnumerable<ReservationDto>> GetAllAsync(bool includeInactive = false);
    Task<ReservationDto?> GetByIdAsync(int id);
    Task<ReservationDto> CreateAsync(CreateReservationDto dto);
    Task<ReservationDto?> UpdateAsync(int id, UpdateReservationDto dto);
    Task<bool> CancelAsync(int id);
    Task<bool> RestoreAsync(int id);
}
