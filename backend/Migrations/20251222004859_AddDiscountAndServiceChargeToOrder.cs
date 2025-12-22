using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddDiscountAndServiceChargeToOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Handle Refunds table changes safely - check if constraint exists before dropping
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    -- Drop FK_Refunds_Payments_PaymentId only if it exists
                    IF EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE constraint_name = 'FK_Refunds_Payments_PaymentId' 
                        AND table_schema = 'identity'
                        AND table_name = 'Refunds'
                    ) THEN
                        ALTER TABLE identity.""Refunds"" DROP CONSTRAINT ""FK_Refunds_Payments_PaymentId"";
                    END IF;

                    -- Drop FK_Refunds_Orders_OrderId only if it exists (we'll recreate it)
                    IF EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE constraint_name = 'FK_Refunds_Orders_OrderId' 
                        AND table_schema = 'identity'
                        AND table_name = 'Refunds'
                    ) THEN
                        ALTER TABLE identity.""Refunds"" DROP CONSTRAINT ""FK_Refunds_Orders_OrderId"";
                    END IF;

                    -- Drop index only if it exists
                    IF EXISTS (
                        SELECT 1 FROM pg_indexes 
                        WHERE indexname = 'IX_Refunds_PaymentId' 
                        AND schemaname = 'identity'
                    ) THEN
                        DROP INDEX IF EXISTS identity.""IX_Refunds_PaymentId"";
                    END IF;

                    -- Drop PaymentId column only if it exists
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_schema = 'identity' 
                        AND table_name = 'Refunds' 
                        AND column_name = 'PaymentId'
                    ) THEN
                        ALTER TABLE identity.""Refunds"" DROP COLUMN ""PaymentId"";
                    END IF;

                    -- Alter OrderId to be non-nullable only if it's currently nullable
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_schema = 'identity' 
                        AND table_name = 'Refunds' 
                        AND column_name = 'OrderId'
                        AND is_nullable = 'YES'
                    ) THEN
                        ALTER TABLE identity.""Refunds"" ALTER COLUMN ""OrderId"" SET NOT NULL;
                    END IF;

                    -- Add IsPartial column only if it doesn't exist
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_schema = 'identity' 
                        AND table_name = 'Refunds' 
                        AND column_name = 'IsPartial'
                    ) THEN
                        ALTER TABLE identity.""Refunds"" ADD COLUMN ""IsPartial"" boolean NOT NULL DEFAULT false;
                    END IF;
                END $$;
            ");

            migrationBuilder.AddColumn<decimal>(
                name: "DiscountAmount",
                schema: "identity",
                table: "Orders",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ServiceChargeAmount",
                schema: "identity",
                table: "Orders",
                type: "numeric",
                nullable: true);

            // Recreate FK_Refunds_Orders_OrderId constraint
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
            migrationBuilder.DropColumn(
                name: "DiscountAmount",
                schema: "identity",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ServiceChargeAmount",
                schema: "identity",
                table: "Orders");

            // Revert Refunds table changes
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    -- Drop FK_Refunds_Orders_OrderId if it exists
                    IF EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE constraint_name = 'FK_Refunds_Orders_OrderId' 
                        AND table_schema = 'identity'
                        AND table_name = 'Refunds'
                    ) THEN
                        ALTER TABLE identity.""Refunds"" DROP CONSTRAINT ""FK_Refunds_Orders_OrderId"";
                    END IF;

                    -- Drop IsPartial column if it exists
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_schema = 'identity' 
                        AND table_name = 'Refunds' 
                        AND column_name = 'IsPartial'
                    ) THEN
                        ALTER TABLE identity.""Refunds"" DROP COLUMN ""IsPartial"";
                    END IF;

                    -- Make OrderId nullable again
                    ALTER TABLE identity.""Refunds"" ALTER COLUMN ""OrderId"" DROP NOT NULL;

                    -- Add PaymentId column if it doesn't exist
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_schema = 'identity' 
                        AND table_name = 'Refunds' 
                        AND column_name = 'PaymentId'
                    ) THEN
                        ALTER TABLE identity.""Refunds"" ADD COLUMN ""PaymentId"" integer NOT NULL DEFAULT 0;
                    END IF;
                END $$;
            ");

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
