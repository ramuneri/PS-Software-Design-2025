using System;
using backend.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20251215120000_AddSoftDeleteToTax")]
    public partial class AddSoftDeleteToTax : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                schema: "identity",
                table: "TaxRates",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                schema: "identity",
                table: "TaxRates",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                schema: "identity",
                table: "TaxCategories",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                schema: "identity",
                table: "TaxCategories",
                type: "boolean",
                nullable: false,
                defaultValue: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeletedAt",
                schema: "identity",
                table: "TaxRates");

            migrationBuilder.DropColumn(
                name: "IsActive",
                schema: "identity",
                table: "TaxRates");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                schema: "identity",
                table: "TaxCategories");

            migrationBuilder.DropColumn(
                name: "IsActive",
                schema: "identity",
                table: "TaxCategories");
        }
    }
}
