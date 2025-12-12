using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    public partial class FixServiceChargePolicySchema : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create new join table for Orders ↔ ServiceChargePolicies
            migrationBuilder.CreateTable(
                name: "OrderServiceChargePolicies",
                schema: "identity",
                columns: table => new
                {
                    OrdersId = table.Column<int>(type: "integer", nullable: false),
                    ServiceChargePoliciesId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderServiceChargePolicies", x => new { x.OrdersId, x.ServiceChargePoliciesId });
                    table.ForeignKey(
                        name: "FK_OrderServiceChargePolicies_Orders_OrdersId",
                        column: x => x.OrdersId,
                        principalSchema: "identity",
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrderServiceChargePolicies_ServiceChargePolicies_ServiceChargePoliciesId",
                        column: x => x.ServiceChargePoliciesId,
                        principalSchema: "identity",
                        principalTable: "ServiceChargePolicies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Create new join table for Services ↔ ServiceChargePolicies
            migrationBuilder.CreateTable(
                name: "ServiceServiceChargePolicies",
                schema: "identity",
                columns: table => new
                {
                    ServiceChargePoliciesId = table.Column<int>(type: "integer", nullable: false),
                    ServicesServiceId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceServiceChargePolicies", x => new { x.ServiceChargePoliciesId, x.ServicesServiceId });
                    table.ForeignKey(
                        name: "FK_ServiceServiceChargePolicies_ServiceChargePolicies_ServiceChargePoliciesId",
                        column: x => x.ServiceChargePoliciesId,
                        principalSchema: "identity",
                        principalTable: "ServiceChargePolicies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ServiceServiceChargePolicies_Services_ServicesServiceId",
                        column: x => x.ServicesServiceId,
                        principalSchema: "identity",
                        principalTable: "Services",
                        principalColumn: "ServiceId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OrderServiceChargePolicies_ServiceChargePoliciesId",
                schema: "identity",
                table: "OrderServiceChargePolicies",
                column: "ServiceChargePoliciesId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceServiceChargePolicies_ServicesServiceId",
                schema: "identity",
                table: "ServiceServiceChargePolicies",
                column: "ServicesServiceId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrderServiceChargePolicies",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "ServiceServiceChargePolicies",
                schema: "identity");
        }
    }
}
