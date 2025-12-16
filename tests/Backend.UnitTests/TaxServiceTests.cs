using backend.Data;
using backend.Data.Models;
using backend.Services.Implementations;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Backend.UnitTests;

public class TaxServiceTests
{
    private static ApplicationDbContext BuildDb()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task GetRatePercentAtAsync_ReturnsHistoricalRate()
    {
        await using var db = BuildDb();
        db.TaxCategories.Add(new TaxCategories
        {
            Id = 1,
            MerchantId = 1,
            Name = "Standard",
            TaxRates = new List<TaxRate>
            {
                new()
                {
                    RatePercent = 10,
                    EffectiveFrom = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    EffectiveTo = new DateTime(2024, 6, 30, 23, 59, 59, DateTimeKind.Utc)
                },
                new()
                {
                    RatePercent = 20,
                    EffectiveFrom = new DateTime(2024, 7, 1, 0, 0, 0, DateTimeKind.Utc),
                    EffectiveTo = null
                }
            }
        });
        await db.SaveChangesAsync();

        var service = new TaxService(db);

        var june = await service.GetRatePercentAtAsync(1, new DateTime(2024, 6, 15, 0, 0, 0, DateTimeKind.Utc));
        var july = await service.GetRatePercentAtAsync(1, new DateTime(2024, 7, 15, 0, 0, 0, DateTimeKind.Utc));

        Assert.Equal(10, june);
        Assert.Equal(20, july);
    }
}
