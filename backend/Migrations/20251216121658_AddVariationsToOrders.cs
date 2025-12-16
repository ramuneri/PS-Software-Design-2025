using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddVariationsToOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ProductVariationId",
                schema: "identity",
                table: "OrderItems",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_ProductVariationId",
                schema: "identity",
                table: "OrderItems",
                column: "ProductVariationId");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItems_ProductVariations_ProductVariationId",
                schema: "identity",
                table: "OrderItems",
                column: "ProductVariationId",
                principalSchema: "identity",
                principalTable: "ProductVariations",
                principalColumn: "ProductVariationId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderItems_ProductVariations_ProductVariationId",
                schema: "identity",
                table: "OrderItems");

            migrationBuilder.DropIndex(
                name: "IX_OrderItems_ProductVariationId",
                schema: "identity",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "ProductVariationId",
                schema: "identity",
                table: "OrderItems");
        }
    }
}
