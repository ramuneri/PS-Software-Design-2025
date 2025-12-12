using backend.Data.Models;
using backend.Dtos;

namespace backend.Mapping;

public static class ServiceChargePolicyMapping
{

    // Entity -> Response DTO
    public static ServiceChargePolicyDto ToDto(this ServiceChargePolicy entity)
    {
        return new ServiceChargePolicyDto(
            Id: entity.Id,
            MerchantId: entity.MerchantId,
            Name: entity.Name,
            Type: entity.Type,
            Value: entity.Value,
            IsActive: entity.IsActive,
            CreatedAt: entity.CreatedAt,
            ServiceIds: entity.ServiceLinks
                .Select(sl => sl.ServicesServiceId)
                .ToList(),
            OrderIds: entity.OrderLinks
                .Select(ol => ol.OrdersId)
                .ToList()
        );
    }

    // Create DTO -> Entity
    public static ServiceChargePolicy ToEntity(
        this CreateServiceChargePolicyDto dto)
    {
        return new ServiceChargePolicy
        {
            MerchantId = dto.MerchantId,
            Name = dto.Name,
            Type = dto.Type,
            Value = dto.Value,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,

            // Initialize collections to avoid null refs
            ServiceLinks = new List<ServiceServiceChargePolicy>(),
            OrderLinks = new List<OrderServiceChargePolicy>()
        };
    }


    // Update DTO -> Entity
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
