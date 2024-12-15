class AddProjectIdToTasks < ActiveRecord::Migration[7.0]
  def change
    add_column :tasks, :project_id, :integer
    add_foreign_key :tasks, :projects
  end
end
