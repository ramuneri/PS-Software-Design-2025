using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddCoreBusinessModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_RefreshTokens",
                schema: "identity",
                table: "RefreshTokens");

            migrationBuilder.AddColumn<int>(
                name: "Id",
                schema: "identity",
                table: "RefreshTokens",
                type: "integer",
                nullable: false,
                defaultValue: 0)
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                schema: "identity",
                table: "RefreshTokens",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                schema: "identity",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "IsSuperAdmin",
                schema: "identity",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastLoginAt",
                schema: "identity",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "MerchantId",
                schema: "identity",
                table: "AspNetUsers",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                schema: "identity",
                table: "AspNetUsers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Role",
                schema: "identity",
                table: "AspNetUsers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Surname",
                schema: "identity",
                table: "AspNetUsers",
                type: "text",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_RefreshTokens",
                schema: "identity",
                table: "RefreshTokens",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "BusinessPricingPolicies",
                schema: "identity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UnitPriceIncludesTax = table.Column<bool>(type: "boolean", nullable: false),
                    MoneyRoundingMode = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessPricingPolicies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Customers",
                schema: "identity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MerchantId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: true),
                    Surname = table.Column<string>(type: "text", nullable: true),
                    Email = table.Column<string>(type: "text", nullable: true),
                    Phone = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Customers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Features",
                schema: "identity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Features", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Merchants",
                schema: "identity",
                columns: table => new
                {
                    MerchantId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OwnerId = table.Column<string>(type: "text", nullable: true),
                    Name = table.Column<string>(type: "text", nullable: true),
                    BusinessType = table.Column<string>(type: "text", nullable: true),
                    Country = table.Column<string>(type: "text", nullable: true),
                    Address = table.Column<string>(type: "text", nullable: true),
                    City = table.Column<string>(type: "text", nullable: true),
                    Phone = table.Column<string>(type: "text", nullable: true),
                    Email = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Merchants", x => x.MerchantId);
                });

            migrationBuilder.CreateTable(
                name: "Plans",
                schema: "identity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: true),
                    Price = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    BillingPeriod = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Plans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ServiceChargePolicies",
                schema: "identity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ServiceChargePolicyId = table.Column<int>(type: "integer", nullable: true),
                    OrderId = table.Column<int>(type: "integer", nullable: true),
                    Name = table.Column<string>(type: "text", nullable: true),
                    Type = table.Column<string>(type: "text", nullable: true),
                    Value = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceChargePolicies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Orders",
                schema: "identity",
                columns: table => new
                {
                    OrderId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EmployeeId = table.Column<string>(type: "text", nullable: true),
                    CustomerId = table.Column<string>(type: "text", nullable: true),
                    BusinessPricingPolicyId = table.Column<int>(type: "integer", nullable: true),
                    TipBasedOnDiscountId = table.Column<int>(type: "integer", nullable: true),
                    OpenedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ClosedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Orders", x => x.OrderId);
                    table.ForeignKey(
                        name: "FK_Orders_AspNetUsers_CustomerId",
                        column: x => x.CustomerId,
                        principalSchema: "identity",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Orders_AspNetUsers_EmployeeId",
                        column: x => x.EmployeeId,
                        principalSchema: "identity",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Orders_BusinessPricingPolicies_BusinessPricingPolicyId",
                        column: x => x.BusinessPricingPolicyId,
                        principalSchema: "identity",
                        principalTable: "BusinessPricingPolicies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Giftcards",
                schema: "identity",
                columns: table => new
                {
                    GiftcardId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MerchantId = table.Column<int>(type: "integer", nullable: false),
                    Code = table.Column<string>(type: "text", nullable: true),
                    InitialBalance = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Balance = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    IssuedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExpirationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Giftcards", x => x.GiftcardId);
                    table.ForeignKey(
                        name: "FK_Giftcards_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalSchema: "identity",
                        principalTable: "Merchants",
                        principalColumn: "MerchantId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TaxCategories",
                schema: "identity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MerchantId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaxCategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaxCategories_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalSchema: "identity",
                        principalTable: "Merchants",
                        principalColumn: "MerchantId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MerchantSubscriptions",
                schema: "identity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MerchantId = table.Column<int>(type: "integer", nullable: false),
                    PlanId = table.Column<int>(type: "integer", nullable: false),
                    StartsAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndsAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MerchantSubscriptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MerchantSubscriptions_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalSchema: "identity",
                        principalTable: "Merchants",
                        principalColumn: "MerchantId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MerchantSubscriptions_Plans_PlanId",
                        column: x => x.PlanId,
                        principalSchema: "identity",
                        principalTable: "Plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PlanFeatures",
                schema: "identity",
                columns: table => new
                {
                    UniqueId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PlanId = table.Column<int>(type: "integer", nullable: false),
                    FeatureId = table.Column<int>(type: "integer", nullable: true),
                    LocationLimit = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanFeatures", x => x.UniqueId);
                    table.ForeignKey(
                        name: "FK_PlanFeatures_Features_FeatureId",
                        column: x => x.FeatureId,
                        principalSchema: "identity",
                        principalTable: "Features",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PlanFeatures_Plans_PlanId",
                        column: x => x.PlanId,
                        principalSchema: "identity",
                        principalTable: "Plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Discounts",
                schema: "identity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ServiceId = table.Column<int>(type: "integer", nullable: true),
                    Name = table.Column<string>(type: "text", nullable: true),
                    Code = table.Column<string>(type: "text", nullable: true),
                    Scope = table.Column<string>(type: "text", nullable: true),
                    Type = table.Column<string>(type: "text", nullable: true),
                    Value = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    StartsAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EndsAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    ServiceChargePolicyId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Discounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Discounts_ServiceChargePolicies_ServiceChargePolicyId",
                        column: x => x.ServiceChargePolicyId,
                        principalSchema: "identity",
                        principalTable: "ServiceChargePolicies",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "OrderServiceChargePolicy",
                schema: "identity",
                columns: table => new
                {
                    OrdersOrderId = table.Column<int>(type: "integer", nullable: false),
                    ServiceChargePoliciesId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderServiceChargePolicy", x => new { x.OrdersOrderId, x.ServiceChargePoliciesId });
                    table.ForeignKey(
                        name: "FK_OrderServiceChargePolicy_Orders_OrdersOrderId",
                        column: x => x.OrdersOrderId,
                        principalSchema: "identity",
                        principalTable: "Orders",
                        principalColumn: "OrderId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrderServiceChargePolicy_ServiceChargePolicies_ServiceCharg~",
                        column: x => x.ServiceChargePoliciesId,
                        principalSchema: "identity",
                        principalTable: "ServiceChargePolicies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrderTips",
                schema: "identity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrderId = table.Column<int>(type: "integer", nullable: false),
                    Source = table.Column<string>(type: "text", nullable: true),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderTips", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderTips_Orders_OrderId",
                        column: x => x.OrderId,
                        principalSchema: "identity",
                        principalTable: "Orders",
                        principalColumn: "OrderId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Payments",
                schema: "identity",
                columns: table => new
                {
                    PaymentId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrderId = table.Column<int>(type: "integer", nullable: false),
                    Method = table.Column<string>(type: "text", nullable: true),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Provider = table.Column<string>(type: "text", nullable: true),
                    Currency = table.Column<string>(type: "text", nullable: true),
                    PaymentStatus = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.PaymentId);
                    table.ForeignKey(
                        name: "FK_Payments_Orders_OrderId",
                        column: x => x.OrderId,
                        principalSchema: "identity",
                        principalTable: "Orders",
                        principalColumn: "OrderId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Products",
                schema: "identity",
                columns: table => new
                {
                    ProductId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MerchantId = table.Column<int>(type: "integer", nullable: false),
                    TaxCategoryId = table.Column<int>(type: "integer", nullable: true),
                    Name = table.Column<string>(type: "text", nullable: true),
                    Price = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    Category = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Products", x => x.ProductId);
                    table.ForeignKey(
                        name: "FK_Products_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalSchema: "identity",
                        principalTable: "Merchants",
                        principalColumn: "MerchantId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Products_TaxCategories_TaxCategoryId",
                        column: x => x.TaxCategoryId,
                        principalSchema: "identity",
                        principalTable: "TaxCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Services",
                schema: "identity",
                columns: table => new
                {
                    ServiceId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MerchantId = table.Column<int>(type: "integer", nullable: false),
                    TaxCategoryId = table.Column<int>(type: "integer", nullable: true),
                    Name = table.Column<string>(type: "text", nullable: true),
                    DefaultPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Services", x => x.ServiceId);
                    table.ForeignKey(
                        name: "FK_Services_Merchants_MerchantId",
                        column: x => x.MerchantId,
                        principalSchema: "identity",
                        principalTable: "Merchants",
                        principalColumn: "MerchantId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Services_TaxCategories_TaxCategoryId",
                        column: x => x.TaxCategoryId,
                        principalSchema: "identity",
                        principalTable: "TaxCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "TaxRates",
                schema: "identity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TaxCategoryId = table.Column<int>(type: "integer", nullable: false),
                    RatePercent = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    EffectiveFrom = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EffectiveTo = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaxRates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaxRates_TaxCategories_TaxCategoryId",
                        column: x => x.TaxCategoryId,
                        principalSchema: "identity",
                        principalTable: "TaxCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GiftcardPayments",
                schema: "identity",
                columns: table => new
                {
                    PaymentId = table.Column<int>(type: "integer", nullable: false),
                    GiftcardId = table.Column<int>(type: "integer", nullable: false),
                    AmountUsed = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GiftcardPayments", x => new { x.PaymentId, x.GiftcardId });
                    table.ForeignKey(
                        name: "FK_GiftcardPayments_Giftcards_GiftcardId",
                        column: x => x.GiftcardId,
                        principalSchema: "identity",
                        principalTable: "Giftcards",
                        principalColumn: "GiftcardId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GiftcardPayments_Payments_PaymentId",
                        column: x => x.PaymentId,
                        principalSchema: "identity",
                        principalTable: "Payments",
                        principalColumn: "PaymentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Refunds",
                schema: "identity",
                columns: table => new
                {
                    RefundId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PaymentId = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Reason = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    OrderId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Refunds", x => x.RefundId);
                    table.ForeignKey(
                        name: "FK_Refunds_Orders_OrderId",
                        column: x => x.OrderId,
                        principalSchema: "identity",
                        principalTable: "Orders",
                        principalColumn: "OrderId");
                    table.ForeignKey(
                        name: "FK_Refunds_Payments_PaymentId",
                        column: x => x.PaymentId,
                        principalSchema: "identity",
                        principalTable: "Payments",
                        principalColumn: "PaymentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EmployeeServices",
                schema: "identity",
                columns: table => new
                {
                    EmployeeId = table.Column<string>(type: "text", nullable: false),
                    ServiceId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmployeeServices", x => new { x.EmployeeId, x.ServiceId });
                    table.ForeignKey(
                        name: "FK_EmployeeServices_AspNetUsers_EmployeeId",
                        column: x => x.EmployeeId,
                        principalSchema: "identity",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EmployeeServices_Services_ServiceId",
                        column: x => x.ServiceId,
                        principalSchema: "identity",
                        principalTable: "Services",
                        principalColumn: "ServiceId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Reservations",
                schema: "identity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EmployeeId = table.Column<string>(type: "text", nullable: true),
                    CustomerId = table.Column<string>(type: "text", nullable: true),
                    ServiceId = table.Column<int>(type: "integer", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: true),
                    StartTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EndTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    BookedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reservations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reservations_AspNetUsers_CustomerId",
                        column: x => x.CustomerId,
                        principalSchema: "identity",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Reservations_AspNetUsers_EmployeeId",
                        column: x => x.EmployeeId,
                        principalSchema: "identity",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Reservations_Services_ServiceId",
                        column: x => x.ServiceId,
                        principalSchema: "identity",
                        principalTable: "Services",
                        principalColumn: "ServiceId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ServiceServiceChargePolicy",
                schema: "identity",
                columns: table => new
                {
                    ServiceChargePoliciesId = table.Column<int>(type: "integer", nullable: false),
                    ServicesServiceId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceServiceChargePolicy", x => new { x.ServiceChargePoliciesId, x.ServicesServiceId });
                    table.ForeignKey(
                        name: "FK_ServiceServiceChargePolicy_ServiceChargePolicies_ServiceCha~",
                        column: x => x.ServiceChargePoliciesId,
                        principalSchema: "identity",
                        principalTable: "ServiceChargePolicies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ServiceServiceChargePolicy_Services_ServicesServiceId",
                        column: x => x.ServicesServiceId,
                        principalSchema: "identity",
                        principalTable: "Services",
                        principalColumn: "ServiceId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrderItems",
                schema: "identity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrderId = table.Column<int>(type: "integer", nullable: false),
                    ProductId = table.Column<int>(type: "integer", nullable: true),
                    ServiceId = table.Column<int>(type: "integer", nullable: true),
                    ReservationId = table.Column<int>(type: "integer", nullable: true),
                    Quantity = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderItems_Orders_OrderId",
                        column: x => x.OrderId,
                        principalSchema: "identity",
                        principalTable: "Orders",
                        principalColumn: "OrderId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrderItems_Products_ProductId",
                        column: x => x.ProductId,
                        principalSchema: "identity",
                        principalTable: "Products",
                        principalColumn: "ProductId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrderItems_Reservations_ReservationId",
                        column: x => x.ReservationId,
                        principalSchema: "identity",
                        principalTable: "Reservations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_OrderItems_Services_ServiceId",
                        column: x => x.ServiceId,
                        principalSchema: "identity",
                        principalTable: "Services",
                        principalColumn: "ServiceId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_Token",
                schema: "identity",
                table: "RefreshTokens",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UserId",
                schema: "identity",
                table: "RefreshTokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_MerchantId",
                schema: "identity",
                table: "AspNetUsers",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_Discounts_ServiceChargePolicyId",
                schema: "identity",
                table: "Discounts",
                column: "ServiceChargePolicyId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeServices_ServiceId",
                schema: "identity",
                table: "EmployeeServices",
                column: "ServiceId");

            migrationBuilder.CreateIndex(
                name: "IX_GiftcardPayments_GiftcardId",
                schema: "identity",
                table: "GiftcardPayments",
                column: "GiftcardId");

            migrationBuilder.CreateIndex(
                name: "IX_Giftcards_Code",
                schema: "identity",
                table: "Giftcards",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Giftcards_MerchantId",
                schema: "identity",
                table: "Giftcards",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantSubscriptions_MerchantId",
                schema: "identity",
                table: "MerchantSubscriptions",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantSubscriptions_PlanId",
                schema: "identity",
                table: "MerchantSubscriptions",
                column: "PlanId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_OrderId",
                schema: "identity",
                table: "OrderItems",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_ProductId",
                schema: "identity",
                table: "OrderItems",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_ReservationId",
                schema: "identity",
                table: "OrderItems",
                column: "ReservationId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_ServiceId",
                schema: "identity",
                table: "OrderItems",
                column: "ServiceId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_BusinessPricingPolicyId",
                schema: "identity",
                table: "Orders",
                column: "BusinessPricingPolicyId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_CustomerId",
                schema: "identity",
                table: "Orders",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_EmployeeId",
                schema: "identity",
                table: "Orders",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_OpenedAt",
                schema: "identity",
                table: "Orders",
                column: "OpenedAt");

            migrationBuilder.CreateIndex(
                name: "IX_OrderServiceChargePolicy_ServiceChargePoliciesId",
                schema: "identity",
                table: "OrderServiceChargePolicy",
                column: "ServiceChargePoliciesId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderTips_OrderId",
                schema: "identity",
                table: "OrderTips",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_OrderId",
                schema: "identity",
                table: "Payments",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_PlanFeatures_FeatureId",
                schema: "identity",
                table: "PlanFeatures",
                column: "FeatureId");

            migrationBuilder.CreateIndex(
                name: "IX_PlanFeatures_PlanId",
                schema: "identity",
                table: "PlanFeatures",
                column: "PlanId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_MerchantId",
                schema: "identity",
                table: "Products",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_TaxCategoryId",
                schema: "identity",
                table: "Products",
                column: "TaxCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Refunds_OrderId",
                schema: "identity",
                table: "Refunds",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_Refunds_PaymentId",
                schema: "identity",
                table: "Refunds",
                column: "PaymentId");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_CustomerId",
                schema: "identity",
                table: "Reservations",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_EmployeeId",
                schema: "identity",
                table: "Reservations",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_ServiceId",
                schema: "identity",
                table: "Reservations",
                column: "ServiceId");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_StartTime",
                schema: "identity",
                table: "Reservations",
                column: "StartTime");

            migrationBuilder.CreateIndex(
                name: "IX_Services_MerchantId",
                schema: "identity",
                table: "Services",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_Services_TaxCategoryId",
                schema: "identity",
                table: "Services",
                column: "TaxCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceServiceChargePolicy_ServicesServiceId",
                schema: "identity",
                table: "ServiceServiceChargePolicy",
                column: "ServicesServiceId");

            migrationBuilder.CreateIndex(
                name: "IX_TaxCategories_MerchantId",
                schema: "identity",
                table: "TaxCategories",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_TaxRates_TaxCategoryId",
                schema: "identity",
                table: "TaxRates",
                column: "TaxCategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_Merchants_MerchantId",
                schema: "identity",
                table: "AspNetUsers",
                column: "MerchantId",
                principalSchema: "identity",
                principalTable: "Merchants",
                principalColumn: "MerchantId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_RefreshTokens_AspNetUsers_UserId",
                schema: "identity",
                table: "RefreshTokens",
                column: "UserId",
                principalSchema: "identity",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_Merchants_MerchantId",
                schema: "identity",
                table: "AspNetUsers");

            migrationBuilder.DropForeignKey(
                name: "FK_RefreshTokens_AspNetUsers_UserId",
                schema: "identity",
                table: "RefreshTokens");

            migrationBuilder.DropTable(
                name: "Customers",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "Discounts",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "EmployeeServices",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "GiftcardPayments",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "MerchantSubscriptions",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "OrderItems",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "OrderServiceChargePolicy",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "OrderTips",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "PlanFeatures",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "Refunds",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "ServiceServiceChargePolicy",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "TaxRates",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "Giftcards",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "Products",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "Reservations",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "Features",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "Plans",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "Payments",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "ServiceChargePolicies",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "Services",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "Orders",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "TaxCategories",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "BusinessPricingPolicies",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "Merchants",
                schema: "identity");

            migrationBuilder.DropPrimaryKey(
                name: "PK_RefreshTokens",
                schema: "identity",
                table: "RefreshTokens");

            migrationBuilder.DropIndex(
                name: "IX_RefreshTokens_Token",
                schema: "identity",
                table: "RefreshTokens");

            migrationBuilder.DropIndex(
                name: "IX_RefreshTokens_UserId",
                schema: "identity",
                table: "RefreshTokens");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_MerchantId",
                schema: "identity",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Id",
                schema: "identity",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                schema: "identity",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                schema: "identity",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "IsSuperAdmin",
                schema: "identity",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "LastLoginAt",
                schema: "identity",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "MerchantId",
                schema: "identity",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Name",
                schema: "identity",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Role",
                schema: "identity",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Surname",
                schema: "identity",
                table: "AspNetUsers");

            migrationBuilder.AddPrimaryKey(
                name: "PK_RefreshTokens",
                schema: "identity",
                table: "RefreshTokens",
                column: "Token");
        }
    }
}
