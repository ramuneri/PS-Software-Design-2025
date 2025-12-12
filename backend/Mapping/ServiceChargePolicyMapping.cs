using backend.Data.Models;
using backend.Dtos;

namespace backend.Mapping;

public static class ServiceChargePolicyMapping
{
    // Entity -> Response DTO
    public static ServiceChargePolicyDto ToDto(this ServiceChargePolicy entity)
    {
        return new ServiceChargePolicyDto(
            entity.Id,
            entity.MerchantId,
            entity.Name,
            entity.Type,
            entity.Value,
            entity.IsActive,
            entity.CreatedAt,
            entity.ServiceLinks.Select(s => s.ServicesServiceId),
            entity.OrderLinks.Select(o => o.OrdersId)
        );
    }

    // Create DTO -> Entity
    public static ServiceChargePolicy ToEntity(this CreateServiceChargePolicyDto dto)
    {
        return new ServiceChargePolicy
        {
            MerchantId = dto.MerchantId,
            Name = dto.Name,
            Type = dto.Type,
            Value = dto.Value,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
    }

    // Update DTO -> existing Entity
    public static void ApplyUpdate(
        this ServiceChargePolicy entity,
        UpdateServiceChargePolicyDto dto)
    {
        if (dto.Name is not null)
            entity.Name = dto.Name;

        if (dto.Type is not null)
            entity.Type = dto.Type;

        if (dto.Value.HasValue)
            entity.Value = dto.Value;

        if (dto.IsActive.HasValue)
            entity.IsActive = dto.IsActive.Value;
    }

}
