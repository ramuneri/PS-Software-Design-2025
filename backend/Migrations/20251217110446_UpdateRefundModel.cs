using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateRefundModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Refunds_Orders_OrderId",
                schema: "identity",
                table: "Refunds");

            migrationBuilder.DropForeignKey(
                name: "FK_Refunds_Payments_PaymentId",
                schema: "identity",
                table: "Refunds");

            migrationBuilder.DropIndex(
                name: "IX_Refunds_PaymentId",
                schema: "identity",
                table: "Refunds");

            migrationBuilder.DropColumn(
                name: "PaymentId",
                schema: "identity",
                table: "Refunds");

            migrationBuilder.AlterColumn<int>(
                name: "OrderId",
                schema: "identity",
                table: "Refunds",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPartial",
                schema: "identity",
                table: "Refunds",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddForeignKey(
                name: "FK_Refunds_Orders_OrderId",
                schema: "identity",
                table: "Refunds",
                column: "OrderId",
                principalSchema: "identity",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Refunds_Orders_OrderId",
                schema: "identity",
                table: "Refunds");

            migrationBuilder.DropColumn(
                name: "IsPartial",
                schema: "identity",
                table: "Refunds");

            migrationBuilder.AlterColumn<int>(
                name: "OrderId",
                schema: "identity",
                table: "Refunds",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "PaymentId",
                schema: "identity",
                table: "Refunds",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Refunds_PaymentId",
                schema: "identity",
                table: "Refunds",
                column: "PaymentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Refunds_Orders_OrderId",
                schema: "identity",
                table: "Refunds",
                column: "OrderId",
                principalSchema: "identity",
                principalTable: "Orders",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Refunds_Payments_PaymentId",
                schema: "identity",
                table: "Refunds",
                column: "PaymentId",
                principalSchema: "identity",
                principalTable: "Payments",
                principalColumn: "PaymentId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
