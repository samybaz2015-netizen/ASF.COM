using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ASF.Repository.Migrations.ApplicationDb
{
    /// <inheritdoc />
    public partial class AddConstructionTemplateFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovalDate",
                table: "Constructions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDraft",
                table: "Constructions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PlanNumber",
                table: "Constructions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlotNumber",
                table: "Constructions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Priority",
                table: "Constructions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SubscriberName",
                table: "Constructions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TaskNumber",
                table: "Constructions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VoltageLevel",
                table: "Constructions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WorkOrderCode",
                table: "Constructions",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApprovalDate",
                table: "Constructions");

            migrationBuilder.DropColumn(
                name: "IsDraft",
                table: "Constructions");

            migrationBuilder.DropColumn(
                name: "PlanNumber",
                table: "Constructions");

            migrationBuilder.DropColumn(
                name: "PlotNumber",
                table: "Constructions");

            migrationBuilder.DropColumn(
                name: "Priority",
                table: "Constructions");

            migrationBuilder.DropColumn(
                name: "SubscriberName",
                table: "Constructions");

            migrationBuilder.DropColumn(
                name: "TaskNumber",
                table: "Constructions");

            migrationBuilder.DropColumn(
                name: "VoltageLevel",
                table: "Constructions");

            migrationBuilder.DropColumn(
                name: "WorkOrderCode",
                table: "Constructions");
        }
    }
}
