using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    public partial class AddMerchantIdToServiceChargePolicies : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MerchantId",
                schema: "identity",
                table: "ServiceChargePolicies",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.CreateIndex(
                name: "IX_ServiceChargePolicies_MerchantId",
                schema: "identity",
                table: "ServiceChargePolicies",
                column: "MerchantId");

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceChargePolicies_Merchants_MerchantId",
                schema: "identity",
                table: "ServiceChargePolicies",
                column: "MerchantId",
                principalSchema: "identity",
                principalTable: "Merchants",
                principalColumn: "MerchantId",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ServiceChargePolicies_Merchants_MerchantId",
                schema: "identity",
                table: "ServiceChargePolicies");

            migrationBuilder.DropIndex(
                name: "IX_ServiceChargePolicies_MerchantId",
                schema: "identity",
                table: "ServiceChargePolicies");

            migrationBuilder.DropColumn(
                name: "MerchantId",
                schema: "identity",
                table: "ServiceChargePolicies");
        }
    }
}
