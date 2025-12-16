using backend.Data;
using backend.Dtos;
using backend.Mapping;
using backend.Exceptions;
using backend.Data.Models;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public class ReservationService : IReservationService
{
    private readonly ApplicationDbContext _db;
    private readonly INotificationSmsService _smsService;

    private const int TEST_MERCHANT_ID = 1;

    public ReservationService(
        ApplicationDbContext db,
        INotificationSmsService smsService
    )
    {
        _db = db;
        _smsService = smsService;
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
            .FirstOrDefaultAsync(r => r.Id == id);

        return reservation?.ToDto();
    }

    public async Task<ReservationDto> CreateAsync(CreateReservationDto dto)
    {
        var service = await _db.Services.FindAsync(dto.ServiceId)
            ?? throw new Exception("Service not found");

        var utcStart = DateTime.SpecifyKind(dto.StartTime, DateTimeKind.Utc);
        ValidateWorkingHours(utcStart);

        var utcEnd = utcStart.AddMinutes(service.DurationMinutes ?? 60);

        if (dto.EmployeeId != null)
        {
            var hasOverlap = await HasOverlapAsync(
                dto.EmployeeId,
                utcStart,
                utcEnd
            );

            if (hasOverlap)
                throw new BusinessRuleException("Employee already has a reservation during this time");
        }

        var reservation = new Reservation
        {
            CustomerId = dto.CustomerId,
            EmployeeId = dto.EmployeeId,
            ServiceId = dto.ServiceId,
            StartTime = utcStart,
            EndTime = utcEnd,
            Status = "Booked",
            IsActive = true,
            BookedAt = DateTime.UtcNow
        };

        _db.Reservations.Add(reservation);
        await _db.SaveChangesAsync();

        if (reservation.Customer != null && reservation.Service != null)
        {
            await _smsService.SendAppointmentCreatedAsync(
                reservation.Customer.PhoneNumber!,
                reservation.StartTime!.Value,
                reservation.Service.Name ?? "Service"
            );
        }


        return reservation.ToDto();

    }

    public async Task<ReservationDto?> UpdateAsync(int id, UpdateReservationDto dto)
    {
        var reservation = await _db.Reservations
            .Include(r => r.Service)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (reservation == null)
            return null;

        // 🔑 Determine FINAL values first
        var finalEmployeeId = dto.EmployeeId ?? reservation.EmployeeId;
        DateTime finalStartTime;

        if (dto.StartTime.HasValue)
        {
            finalStartTime = DateTime.SpecifyKind(dto.StartTime.Value, DateTimeKind.Utc);
        }
        else if (reservation.StartTime.HasValue)
        {
            finalStartTime = reservation.StartTime.Value;
        }
        else
        {
            throw new BusinessRuleException("Reservation has no start time");
        }


        ValidateWorkingHours(finalStartTime);

        var finalEndTime = finalStartTime.AddMinutes(
            reservation.Service?.DurationMinutes ?? 60
        );

        // 🔒 Overlap check if employee exists
        if (finalEmployeeId != null)
        {
            var hasOverlap = await HasOverlapAsync(
                finalEmployeeId,
                finalStartTime,
                finalEndTime,
                reservation.Id
            );

            if (hasOverlap)
                throw new BusinessRuleException("Employee already has a reservation during this time");
        }

        reservation.EmployeeId = finalEmployeeId;
        reservation.StartTime = finalStartTime;
        reservation.EndTime = finalEndTime;

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

    private static void ValidateWorkingHours(DateTime startTime)
    {
        var hour = startTime.Hour;

        if (hour < 7 || hour >= 20)
            throw new BusinessRuleException("Reservations are allowed only between 07:00 and 20:00");
    }

    private async Task<bool> HasOverlapAsync(
        string employeeId,
        DateTime start,
        DateTime end,
        int? ignoreReservationId = null
    )
    {
        return await _db.Reservations.AnyAsync(r =>
            r.EmployeeId == employeeId &&
            r.IsActive &&
            (ignoreReservationId == null || r.Id != ignoreReservationId) &&
            start < r.EndTime &&
            end > r.StartTime
        );
    }
}
