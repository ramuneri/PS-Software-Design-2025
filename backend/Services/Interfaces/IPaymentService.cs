using backend.Dtos;

namespace backend.Services.Interfaces;

public interface IPaymentService
{
    Task<IEnumerable<PaymentDto>> GetAllAsync(string? search, string? method);
    Task<PaymentDto?> GetByIdAsync(int paymentId);
    Task<PaymentDto> CreateAsync(CreatePaymentDto dto);
    Task<PaymentDto?> UpdateAsync(int paymentId, UpdatePaymentDto dto);
    Task<bool> DeleteAsync(int paymentId);
}
