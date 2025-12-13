using backend.Data;
using backend.Data.Models;
using backend.Dtos;
using backend.Mapping;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class ReservationService : IReservationService
{
    private readonly ApplicationDbContext _db;

    private const int TEST_MERCHANT_ID = 1;

    public ReservationService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<ReservationDto>> GetAllAsync(bool includeInactive = false)
    {
        var query = _db.Reservations
            .Include(r => r.Employee)
            .Include(r => r.Customer)
            .Include(r => r.Service)
            .Where(r => r.Service!.MerchantId == TEST_MERCHANT_ID);

        if (!includeInactive)
            query = query.Where(r => r.IsActive);

        return await query
            .OrderBy(r => r.StartTime)
            .Select(r => r.ToDto())
            .ToListAsync();
    }

    public async Task<ReservationDto?> GetByIdAsync(int id)
    {
        var reservation = await _db.Reservations
            .Include(r => r.Employee)
            .Include(r => r.Customer)
            .Include(r => r.Service)
            .FirstOrDefaultAsync(r => r.Id == id && r.IsActive);

        return reservation?.ToDto();
    }

    public async Task<ReservationDto> CreateAsync(CreateReservationDto dto)
    {
        var service = await _db.Services.FindAsync(dto.ServiceId)
            ?? throw new Exception("Service not found");

        var reservation = new Reservation
        {
            CustomerId = dto.CustomerId,
            EmployeeId = dto.EmployeeId,
            ServiceId = dto.ServiceId,
            StartTime = dto.StartTime,
            EndTime = dto.StartTime.AddMinutes(service.DurationMinutes ?? 0),
            Status = "Booked",
            IsActive = true,
            BookedAt = DateTime.UtcNow
        };

        _db.Reservations.Add(reservation);
        await _db.SaveChangesAsync();

        return reservation.ToDto();
    }

    public async Task<ReservationDto?> UpdateAsync(int id, UpdateReservationDto dto)
    {
        var reservation = await _db.Reservations
            .Include(r => r.Service)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (reservation == null)
            return null;

        if (dto.EmployeeId != null)
            reservation.EmployeeId = dto.EmployeeId;

        if (dto.StartTime.HasValue)
        {
            reservation.StartTime = dto.StartTime;
            reservation.EndTime = dto.StartTime.Value.AddMinutes(
                reservation.Service?.DurationMinutes ?? 0);
        }

        if (dto.Status != null)
            reservation.Status = dto.Status;

        if (dto.IsActive.HasValue)
            reservation.IsActive = dto.IsActive.Value;

        await _db.SaveChangesAsync();
        return reservation.ToDto();
    }

    public async Task<bool> CancelAsync(int id)
    {
        var reservation = await _db.Reservations.FindAsync(id);
        if (reservation == null)
            return false;

        reservation.IsActive = false;
        reservation.Status = "Cancelled";

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RestoreAsync(int id)
    {
        var reservation = await _db.Reservations.FindAsync(id);
        if (reservation == null)
            return false;

        reservation.IsActive = true;
        reservation.Status = "Booked";

        await _db.SaveChangesAsync();
        return true;
    }
}
