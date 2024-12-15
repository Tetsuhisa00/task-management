class AddDetailsToProjects < ActiveRecord::Migration[7.0]
  def change
    add_reference :projects, :manager, foreign_key: { to_table: :users }
    add_column :projects, :deadline, :datetime
    add_column :projects, :customer_requirements, :text
    add_column :projects, :development_input, :text
    add_column :projects, :development_environment, :text
    add_column :projects, :quality_definition, :text
  end
end

