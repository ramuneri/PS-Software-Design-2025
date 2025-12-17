using backend.Data.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace backend.Data
{
    public class ApplicationDbContext : IdentityDbContext<User>
    {
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<Merchant> Merchants { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<ProductVariation> ProductVariations { get; set; }
        public DbSet<Service> Services { get; set; }
        public DbSet<ServiceChargePolicy> ServiceChargePolicies { get; set; }
        public DbSet<OrderServiceChargePolicy> OrderServiceChargePolicies { get; set; }
        public DbSet<ServiceServiceChargePolicy> ServiceServiceChargePolicies { get; set; }

        public DbSet<Discount> Discounts { get; set; }
        public DbSet<TaxCategories> TaxCategories { get; set; }
        public DbSet<TaxRate> TaxRates { get; set; }
        public DbSet<EmployeeService> EmployeeServices { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<OrderTip> OrderTips { get; set; }
        public DbSet<BusinessPricingPolicy> BusinessPricingPolicies { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Refund> Refunds { get; set; }
        public DbSet<Giftcard> Giftcards { get; set; }
        public DbSet<GiftcardPayment> GiftcardPayments { get; set; }
        public DbSet<Reservation> Reservations { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<MerchantSubscription> MerchantSubscriptions { get; set; }
        public DbSet<Plan> Plans { get; set; }
        public DbSet<Feature> Features { get; set; }
        public DbSet<PlanFeature> PlanFeatures { get; set; }
        public DbSet<Invite> Invites { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {

        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.HasDefaultSchema("identity");

            // Configure composite keys
            builder.Entity<EmployeeService>()
                .HasKey(es => new { es.EmployeeId, es.ServiceId });

            builder.Entity<GiftcardPayment>()
                .HasKey(gp => new { gp.PaymentId, gp.GiftcardId });

            // Configure User (Employee) -> Order relationship
            builder.Entity<Order>()
                .HasOne(o => o.Employee)
                .WithMany(u => u.EmployeeOrders)
                .HasForeignKey(o => o.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure User (Employee) -> Reservation relationship
            builder.Entity<Reservation>()
                .HasOne(r => r.Employee)
                .WithMany(u => u.EmployeeReservations)
                .HasForeignKey(r => r.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure User (Customer) -> Reservation relationship
            builder.Entity<Reservation>()
                .HasOne(r => r.Customer)
                .WithMany(u => u.CustomerReservations)
                .HasForeignKey(r => r.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure EmployeeService relationships
            builder.Entity<EmployeeService>()
                .HasOne(es => es.Employee)
                .WithMany(u => u.EmployeeServices)
                .HasForeignKey(es => es.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<EmployeeService>()
                .HasOne(es => es.Service)
                .WithMany(s => s.EmployeeServices)
                .HasForeignKey(es => es.ServiceId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure User -> Merchant relationship
            builder.Entity<User>()
                .HasOne(u => u.Merchant)
                .WithMany(m => m.Users)
                .HasForeignKey(u => u.MerchantId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure RefreshToken -> User relationship
            builder.Entity<RefreshToken>()
                .HasOne(rt => rt.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Product relationships
            builder.Entity<Product>()
                .HasOne(p => p.Merchant)
                .WithMany(m => m.Products)
                .HasForeignKey(p => p.MerchantId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Product>()
                .HasOne(p => p.TaxCategory)
                .WithMany()
                .HasForeignKey(p => p.TaxCategoryId)
                .OnDelete(DeleteBehavior.SetNull);
            
            builder.Entity<ProductVariation>()
                .HasOne(pv => pv.Product)
                .WithMany(p => p.Variations)
                .HasForeignKey(pv => pv.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<ProductVariation>()
                .Property(pv => pv.PriceAdjustment)
                .HasPrecision(18, 2);

            builder.Entity<ProductVariation>()
                .HasIndex(pv => pv.ProductId);

            // Configure Service relationships
            builder.Entity<Service>()
                .HasOne(s => s.Merchant)
                .WithMany(m => m.Services)
                .HasForeignKey(s => s.MerchantId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Service>()
                .HasOne(s => s.TaxCategory)
                .WithMany()
                .HasForeignKey(s => s.TaxCategoryId)
                .OnDelete(DeleteBehavior.SetNull);

            // Configure TaxCategories -> Merchant relationship
            builder.Entity<TaxCategories>()
                .HasOne(tc => tc.Merchant)
                .WithMany(m => m.TaxCategories)
                .HasForeignKey(tc => tc.MerchantId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure TaxRate -> TaxCategories relationship
            builder.Entity<TaxRate>()
                .HasOne(tr => tr.TaxCategory)
                .WithMany(tc => tc.TaxRates)
                .HasForeignKey(tr => tr.TaxCategoryId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Order relationships
            builder.Entity<Order>()
                .HasOne(o => o.BusinessPricingPolicy)
                .WithMany(bpp => bpp.Orders)
                .HasForeignKey(o => o.BusinessPricingPolicyId)
                .OnDelete(DeleteBehavior.SetNull);

            // Configure OrderItem relationships
            builder.Entity<OrderItem>()
                .HasOne(oi => oi.Order)
                .WithMany(o => o.OrderItems)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<OrderItem>()
                .HasOne(oi => oi.Product)
                .WithMany(p => p.OrderItems)
                .HasForeignKey(oi => oi.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<OrderItem>()
                .HasOne(oi => oi.Service)
                .WithMany(s => s.OrderItems)
                .HasForeignKey(oi => oi.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<OrderItem>()
                .HasOne(oi => oi.Reservation)
                .WithMany(r => r.OrderItems)
                .HasForeignKey(oi => oi.ReservationId)
                .OnDelete(DeleteBehavior.SetNull);
            
            builder.Entity<OrderItem>()
                .HasOne(oi => oi.ProductVariation)
                .WithMany()
                .HasForeignKey(oi => oi.ProductVariationId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure OrderTip -> Order relationship
            builder.Entity<OrderTip>()
                .HasOne(ot => ot.Order)
                .WithMany(o => o.OrderTips)
                .HasForeignKey(ot => ot.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Payment -> Order relationship
            builder.Entity<Payment>()
                .HasOne(p => p.Order)
                .WithMany(o => o.Payments)
                .HasForeignKey(p => p.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Refund -> Order relationship
            builder.Entity<Refund>()
                .HasOne(r => r.Order)
                .WithMany(o => o.Refunds)
                .HasForeignKey(r => r.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure GiftcardPayment relationships
            builder.Entity<GiftcardPayment>()
                .HasOne(gp => gp.Payment)
                .WithMany(p => p.GiftcardPayments)
                .HasForeignKey(gp => gp.PaymentId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<GiftcardPayment>()
                .HasOne(gp => gp.Giftcard)
                .WithMany(g => g.GiftcardPayments)
                .HasForeignKey(gp => gp.GiftcardId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Giftcard -> Merchant relationship
            builder.Entity<Giftcard>()
                .HasOne(g => g.Merchant)
                .WithMany(m => m.Giftcards)
                .HasForeignKey(g => g.MerchantId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Reservation relationships
            builder.Entity<Reservation>()
                .HasOne(r => r.Service)
                .WithMany(s => s.Reservations)
                .HasForeignKey(r => r.ServiceId)
                .OnDelete(DeleteBehavior.SetNull);

            // Configure MerchantSubscription relationships
            builder.Entity<MerchantSubscription>()
                .HasOne(ms => ms.Merchant)
                .WithMany(m => m.Subscriptions)
                .HasForeignKey(ms => ms.MerchantId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<MerchantSubscription>()
                .HasOne(ms => ms.Plan)
                .WithMany(p => p.Subscriptions)
                .HasForeignKey(ms => ms.PlanId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure PlanFeature relationships
            builder.Entity<PlanFeature>()
                .HasOne(pf => pf.Plan)
                .WithMany(p => p.PlanFeatures)
                .HasForeignKey(pf => pf.PlanId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<PlanFeature>()
                .HasOne(pf => pf.Feature)
                .WithMany(f => f.PlanFeatures)
                .HasForeignKey(pf => pf.FeatureId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure decimal precision for monetary values
            builder.Entity<Product>()
                .Property(p => p.Price)
                .HasPrecision(18, 2);

            builder.Entity<Service>()
                .Property(s => s.DefaultPrice)
                .HasPrecision(18, 2);

            builder.Entity<ServiceChargePolicy>()
                .Property(scp => scp.Value)
                .HasPrecision(18, 2);


            // --------------------------------------------------------

            // ORDER ↔ SERVICE CHARGE POLICY many-to-many (via OrderServiceChargePolicy)
            builder.Entity<OrderServiceChargePolicy>()
                .HasKey(x => new { x.OrdersId, x.ServiceChargePoliciesId });

            builder.Entity<OrderServiceChargePolicy>()
                .HasOne(x => x.Order)
                .WithMany(o => o.OrderLinks)
                .HasForeignKey(x => x.OrdersId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<OrderServiceChargePolicy>()
                .HasOne(x => x.ServiceChargePolicy)
                .WithMany(p => p.OrderLinks)
                .HasForeignKey(x => x.ServiceChargePoliciesId)
                .OnDelete(DeleteBehavior.Cascade);


            // --------------------------------------------------------

            // SERVICE ↔ SERVICE CHARGE POLICY many-to-many (via ServiceServiceChargePolicy)
            builder.Entity<ServiceServiceChargePolicy>()
                .HasKey(x => new { x.ServiceChargePoliciesId, x.ServicesServiceId });

            builder.Entity<ServiceServiceChargePolicy>()
                .HasOne(x => x.Service)
                .WithMany(s => s.ServiceLinks)
                .HasForeignKey(x => x.ServicesServiceId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<ServiceServiceChargePolicy>()
                .HasOne(x => x.ServiceChargePolicy)
                .WithMany(p => p.ServiceLinks)
                .HasForeignKey(x => x.ServiceChargePoliciesId)
                .OnDelete(DeleteBehavior.Cascade);


            // --------------------------------------------------------


            builder.Entity<Discount>()
                .Property(d => d.Value)
                .HasPrecision(18, 2);

            builder.Entity<TaxRate>()
                .Property(tr => tr.RatePercent)
                .HasPrecision(5, 2);

            builder.Entity<Payment>()
                .Property(p => p.Amount)
                .HasPrecision(18, 2);

            builder.Entity<OrderTip>()
                .Property(ot => ot.Amount)
                .HasPrecision(18, 2);

            builder.Entity<Refund>()
                .Property(r => r.Amount)
                .HasPrecision(18, 2);

            builder.Entity<Giftcard>()
                .Property(g => g.InitialBalance)
                .HasPrecision(18, 2);

            builder.Entity<Giftcard>()
                .Property(g => g.Balance)
                .HasPrecision(18, 2);

            builder.Entity<GiftcardPayment>()
                .Property(gp => gp.AmountUsed)
                .HasPrecision(18, 2);

            builder.Entity<Plan>()
                .Property(p => p.Price)
                .HasPrecision(18, 2);

            // Configure indexes for performance
            builder.Entity<RefreshToken>()
                .HasIndex(rt => rt.Token)
                .IsUnique();

            builder.Entity<RefreshToken>()
                .HasIndex(rt => rt.UserId);

            builder.Entity<Order>()
                .HasIndex(o => o.EmployeeId);

            builder.Entity<Order>()
                .HasIndex(o => o.OpenedAt);

            builder.Entity<Reservation>()
                .HasIndex(r => r.EmployeeId);

            builder.Entity<Reservation>()
                .HasIndex(r => r.CustomerId);

            builder.Entity<Reservation>()
                .HasIndex(r => r.StartTime);

            builder.Entity<Giftcard>()
                .HasIndex(g => g.Code)
                .IsUnique();

            builder.Entity<Product>()
                .HasIndex(p => p.MerchantId);

            builder.Entity<Service>()
                .HasIndex(s => s.MerchantId);

            builder.Entity<Refund>()
                .HasIndex(r => r.OrderId);
            // --------------------------------------------------------

            builder.Entity<Invite>()
                .HasOne(i => i.Merchant)
                .WithMany(m => m.Invites)
                .HasForeignKey(i => i.MerchantId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Invite>()
                .HasOne(i => i.InvitedBy)
                .WithMany(u => u.InvitesCreated)
                .HasForeignKey(i => i.InvitedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Invite>()
                .HasIndex(i => i.Token)
                .IsUnique();

            builder.Entity<Invite>()
                .HasIndex(i => i.Email);

            builder.Entity<Invite>()
                .HasIndex(i => i.MerchantId);
        }
    }
}