using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ASF.Repository.Migrations
{
    /// <inheritdoc />
    public partial class gfhbgfb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContractNumber",
                table: "PrivateProjects",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContractNumber",
                table: "PrivateProjectDeleted",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContractNumber",
                table: "NewProjects",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContractNumber",
                table: "NewProjectDeleted",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContractNumber",
                table: "Maintenances",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContractNumber",
                table: "MaintenanceDeleted",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContractNumber",
                table: "Emergencys",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContractNumber",
                table: "EmergencyDeleted",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContractNumber",
                table: "Constructions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContractNumber",
                table: "ConstructionDeleted",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContractNumber",
                table: "PrivateProjects");

            migrationBuilder.DropColumn(
                name: "ContractNumber",
                table: "PrivateProjectDeleted");

            migrationBuilder.DropColumn(
                name: "ContractNumber",
                table: "NewProjects");

            migrationBuilder.DropColumn(
                name: "ContractNumber",
                table: "NewProjectDeleted");

            migrationBuilder.DropColumn(
                name: "ContractNumber",
                table: "Maintenances");

            migrationBuilder.DropColumn(
                name: "ContractNumber",
                table: "MaintenanceDeleted");

            migrationBuilder.DropColumn(
                name: "ContractNumber",
                table: "Emergencys");

            migrationBuilder.DropColumn(
                name: "ContractNumber",
                table: "EmergencyDeleted");

            migrationBuilder.DropColumn(
                name: "ContractNumber",
                table: "Constructions");

            migrationBuilder.DropColumn(
                name: "ContractNumber",
                table: "ConstructionDeleted");
        }
    }
}
