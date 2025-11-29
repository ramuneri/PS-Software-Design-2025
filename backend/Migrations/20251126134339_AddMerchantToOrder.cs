using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddMerchantToOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderItems_Orders_OrderId",
                schema: "identity",
                table: "OrderItems");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderServiceChargePolicy_Orders_OrdersOrderId",
                schema: "identity",
                table: "OrderServiceChargePolicy");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderTips_Orders_OrderId",
                schema: "identity",
                table: "OrderTips");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Orders_OrderId",
                schema: "identity",
                table: "Payments");

            migrationBuilder.DropForeignKey(
                name: "FK_Refunds_Orders_OrderId",
                schema: "identity",
                table: "Refunds");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Orders",
                schema: "identity",
                table: "Orders");

            migrationBuilder.RenameColumn(
                name: "OrdersOrderId",
                schema: "identity",
                table: "OrderServiceChargePolicy",
                newName: "OrdersId");

            migrationBuilder.RenameColumn(
                name: "OrderId",
                schema: "identity",
                table: "Orders",
                newName: "MerchantId");

            migrationBuilder.AlterColumn<DateTime>(
                name: "OpenedAt",
                schema: "identity",
                table: "Orders",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "MerchantId",
                schema: "identity",
                table: "Orders",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer")
                .OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AddColumn<int>(
                name: "Id",
                schema: "identity",
                table: "Orders",
                type: "integer",
                nullable: false,
                defaultValue: 0)
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AddColumn<string>(
                name: "Note",
                schema: "identity",
                table: "Orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Orders",
                schema: "identity",
                table: "Orders",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItems_Orders_OrderId",
                schema: "identity",
                table: "OrderItems",
                column: "OrderId",
                principalSchema: "identity",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderServiceChargePolicy_Orders_OrdersId",
                schema: "identity",
                table: "OrderServiceChargePolicy",
                column: "OrdersId",
                principalSchema: "identity",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderTips_Orders_OrderId",
                schema: "identity",
                table: "OrderTips",
                column: "OrderId",
                principalSchema: "identity",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Orders_OrderId",
                schema: "identity",
                table: "Payments",
                column: "OrderId",
                principalSchema: "identity",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Refunds_Orders_OrderId",
                schema: "identity",
                table: "Refunds",
                column: "OrderId",
                principalSchema: "identity",
                principalTable: "Orders",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderItems_Orders_OrderId",
                schema: "identity",
                table: "OrderItems");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderServiceChargePolicy_Orders_OrdersId",
                schema: "identity",
                table: "OrderServiceChargePolicy");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderTips_Orders_OrderId",
                schema: "identity",
                table: "OrderTips");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Orders_OrderId",
                schema: "identity",
                table: "Payments");

            migrationBuilder.DropForeignKey(
                name: "FK_Refunds_Orders_OrderId",
                schema: "identity",
                table: "Refunds");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Orders",
                schema: "identity",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "Id",
                schema: "identity",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "Note",
                schema: "identity",
                table: "Orders");

            migrationBuilder.RenameColumn(
                name: "OrdersId",
                schema: "identity",
                table: "OrderServiceChargePolicy",
                newName: "OrdersOrderId");

            migrationBuilder.RenameColumn(
                name: "MerchantId",
                schema: "identity",
                table: "Orders",
                newName: "OrderId");

            migrationBuilder.AlterColumn<DateTime>(
                name: "OpenedAt",
                schema: "identity",
                table: "Orders",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<int>(
                name: "OrderId",
                schema: "identity",
                table: "Orders",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer")
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Orders",
                schema: "identity",
                table: "Orders",
                column: "OrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItems_Orders_OrderId",
                schema: "identity",
                table: "OrderItems",
                column: "OrderId",
                principalSchema: "identity",
                principalTable: "Orders",
                principalColumn: "OrderId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderServiceChargePolicy_Orders_OrdersOrderId",
                schema: "identity",
                table: "OrderServiceChargePolicy",
                column: "OrdersOrderId",
                principalSchema: "identity",
                principalTable: "Orders",
                principalColumn: "OrderId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderTips_Orders_OrderId",
                schema: "identity",
                table: "OrderTips",
                column: "OrderId",
                principalSchema: "identity",
                principalTable: "Orders",
                principalColumn: "OrderId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Orders_OrderId",
                schema: "identity",
                table: "Payments",
                column: "OrderId",
                principalSchema: "identity",
                principalTable: "Orders",
                principalColumn: "OrderId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Refunds_Orders_OrderId",
                schema: "identity",
                table: "Refunds",
                column: "OrderId",
                principalSchema: "identity",
                principalTable: "Orders",
                principalColumn: "OrderId");
        }
    }
}
