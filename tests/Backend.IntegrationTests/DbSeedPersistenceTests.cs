using System.Threading.Tasks;
using backend.Data;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Backend.IntegrationTests;

public class DbSeedPersistenceTests : IClassFixture<PostgresTestApplicationFactory>
{
    private readonly IServiceScopeFactory _scopeFactory;

    public DbSeedPersistenceTests(PostgresTestApplicationFactory factory)
    {
        _scopeFactory = factory.Services.GetRequiredService<IServiceScopeFactory>();
    }

    [Fact]
    public void SeededData_ShouldExist_AfterRestart()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var seededUser = db.Users.FirstOrDefault(u => u.Email == "test@temp.com");
        Assert.NotNull(seededUser);
    }
}
