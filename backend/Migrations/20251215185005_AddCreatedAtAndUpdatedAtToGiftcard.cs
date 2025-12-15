using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddCreatedAtAndUpdatedAtToGiftcard : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "IssuedDate",
                schema: "identity",
                table: "Giftcards",
                newName: "ExpiresAt");

            migrationBuilder.RenameColumn(
                name: "ExpirationDate",
                schema: "identity",
                table: "Giftcards",
                newName: "DeletedAt");

            migrationBuilder.AlterColumn<string>(
                name: "Code",
                schema: "identity",
                table: "Giftcards",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                schema: "identity",
                table: "Giftcards",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                schema: "identity",
                table: "Giftcards",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "IssuedAt",
                schema: "identity",
                table: "Giftcards",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                schema: "identity",
                table: "Giftcards",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedAt",
                schema: "identity",
                table: "Giftcards");

            migrationBuilder.DropColumn(
                name: "IsActive",
                schema: "identity",
                table: "Giftcards");

            migrationBuilder.DropColumn(
                name: "IssuedAt",
                schema: "identity",
                table: "Giftcards");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                schema: "identity",
                table: "Giftcards");

            migrationBuilder.RenameColumn(
                name: "ExpiresAt",
                schema: "identity",
                table: "Giftcards",
                newName: "IssuedDate");

            migrationBuilder.RenameColumn(
                name: "DeletedAt",
                schema: "identity",
                table: "Giftcards",
                newName: "ExpirationDate");

            migrationBuilder.AlterColumn<string>(
                name: "Code",
                schema: "identity",
                table: "Giftcards",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");
        }
    }
}
